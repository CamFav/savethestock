using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Contracts.Invitations;
using SaveTheStock.Application.Authentication;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Security;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using SaveTheStock.Application.Options;
using Microsoft.Extensions.Options;
using SaveTheStock.Api.Security;

namespace SaveTheStock.Api.Controllers.Invitations;

[ApiController]
[Route("api/invitations")]
public sealed class InvitationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly IPasswordService _passwordService;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly JwtOptions _jwtOptions;
    private readonly AuthCookieService _authCookieService;
    private readonly ILogger<InvitationsController> _logger;

    public InvitationsController(
        AppDbContext dbContext,
        ICurrentUser currentUser,
        IPasswordService passwordService,
        IJwtTokenGenerator jwtTokenGenerator,
        IOptions<JwtOptions> jwtOptions,
        AuthCookieService authCookieService,
        ILogger<InvitationsController> logger)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _passwordService = passwordService;
        _jwtTokenGenerator = jwtTokenGenerator;
        _jwtOptions = jwtOptions.Value;
        _authCookieService = authCookieService;
        _logger = logger;
    }

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPost]
    [ProducesResponseType(typeof(InvitationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<InvitationResponse>> Create(
        [FromBody] CreateInvitationRequest request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.CompanyId is null || _currentUser.AccountId is null)
        {
            return Unauthorized();
        }

        var normalizedEmail = EmailNormalizer.Normalize(request.Email);
        if (normalizedEmail is null)
        {
            return BadRequest("L’email est requis.");
        }

        var displayName = request.DisplayName?.Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            return BadRequest("Le nom est requis.");
        }

        if (!string.Equals(request.Role, "MEMBER", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Le rôle MEMBER est le seul disponible pour cette version.");
        }

        var company = await _dbContext.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == _currentUser.CompanyId.Value, cancellationToken);

        if (company is null)
        {
            return BadRequest("Société introuvable.");
        }

        var activeAccount = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.Email == normalizedEmail &&
                a.DeletedAt == null,
                cancellationToken);

        if (activeAccount is not null && activeAccount.CompanyId != company.Id)
        {
            return BadRequest("Cet email est déjà utilisé dans une autre société. Le modèle actuel ne permet pas encore le multi-company.");
        }

        var existingPendingInvitation = await _dbContext.Invitations
            .FirstOrDefaultAsync(i =>
                i.CompanyId == company.Id &&
                i.Email == normalizedEmail &&
                i.Status == InvitationStatuses.Pending,
                cancellationToken);

        if (existingPendingInvitation is not null)
        {
            RefreshStatus(existingPendingInvitation);
            if (existingPendingInvitation.Status == InvitationStatuses.Pending)
            {
                return BadRequest("Une invitation active existe déjà pour cet email.");
            }
        }

        var invitation = new Invitation
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Email = normalizedEmail,
            DisplayName = displayName,
            Role = "Member",
            Token = GenerateToken(),
            Status = InvitationStatuses.Pending,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByAccountId = _currentUser.AccountId.Value,
        };

        _dbContext.Invitations.Add(invitation);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetByToken),
            new { token = invitation.Token },
            ToResponse(invitation, company.Name));
    }

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<InvitationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<InvitationResponse>>> GetAll(CancellationToken cancellationToken)
    {
        if (_currentUser.CompanyId is null)
        {
            return Unauthorized();
        }

        var company = await _dbContext.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == _currentUser.CompanyId.Value, cancellationToken);

        if (company is null)
        {
            return Ok(Array.Empty<InvitationResponse>());
        }

        var invitations = await _dbContext.Invitations
            .Where(i => i.CompanyId == company.Id)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        var statusesUpdated = false;
        foreach (var invitation in invitations)
        {
            statusesUpdated |= RefreshStatus(invitation);
        }

        if (statusesUpdated)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(invitations.Select(i => ToResponse(i, company.Name)).ToList());
    }

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPost("{id:guid}/revoke")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken cancellationToken)
    {
        if (_currentUser.CompanyId is null)
        {
            return Unauthorized();
        }

        var invitation = await _dbContext.Invitations
            .FirstOrDefaultAsync(i => i.Id == id && i.CompanyId == _currentUser.CompanyId.Value, cancellationToken);

        if (invitation is null)
        {
            return NotFound();
        }

        RefreshStatus(invitation);

        if (invitation.Status == InvitationStatuses.Accepted)
        {
            return BadRequest("Une invitation déjà acceptée ne peut pas être annulée.");
        }

        if (invitation.Status == InvitationStatuses.Revoked)
        {
            return NoContent();
        }

        invitation.Status = InvitationStatuses.Revoked;
        invitation.RevokedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("token/{token}")]
    [ProducesResponseType(typeof(InvitationTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvitationTokenResponse>> GetByToken(string token, CancellationToken cancellationToken)
    {
        var invitation = await _dbContext.Invitations
            .Include(i => i.Company)
            .FirstOrDefaultAsync(i => i.Token == token, cancellationToken);

        if (invitation is null || invitation.Company is null)
        {
            return NotFound();
        }

        if (RefreshStatus(invitation))
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(ToTokenResponse(invitation, invitation.Company.Name));
    }

    [AllowAnonymous]
    [HttpPost("token/{token}/accept")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoginResponse>> Accept(
        string token,
        [FromBody] AcceptInvitationRequest request,
        CancellationToken cancellationToken)
    {
        var invitation = await _dbContext.Invitations
            .Include(i => i.Company)
            .FirstOrDefaultAsync(i => i.Token == token, cancellationToken);

        if (invitation is null || invitation.Company is null)
        {
            return NotFound();
        }

        RefreshStatus(invitation);

        if (invitation.Status != InvitationStatuses.Pending)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return BadRequest(GetInvitationUnavailableMessage(invitation.Status));
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Le mot de passe est requis.");
        }

        var mode = request.Mode?.Trim().ToUpperInvariant();
        if (mode != "REGISTER" && mode != "LOGIN")
        {
            return BadRequest("Le mode d’acceptation est invalide.");
        }

        var existingAccount = await _dbContext.Accounts
            .FirstOrDefaultAsync(a =>
                a.Email == invitation.Email &&
                a.DeletedAt == null,
                cancellationToken);

        Account account;

        if (mode == "REGISTER")
        {
            if (existingAccount is not null)
            {
                return BadRequest("Un compte existe déjà pour cet email. Connectez-vous pour accepter l’invitation.");
            }

            account = new Account
            {
                Id = Guid.NewGuid(),
                CompanyId = invitation.CompanyId,
                Email = invitation.Email,
                DisplayName = invitation.DisplayName,
                Role = invitation.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };
            account.PasswordHash = _passwordService.HashPassword(account, request.Password);
            _dbContext.Accounts.Add(account);
        }
        else
        {
            if (existingAccount is null)
            {
                return BadRequest("Aucun compte n’existe encore pour cet email. Créez votre compte pour accepter l’invitation.");
            }

            if (existingAccount.CompanyId != invitation.CompanyId)
            {
                return BadRequest("Ce compte appartient déjà à une autre société. Le rattachement multi-company n’est pas encore disponible.");
            }

            var storedPasswordHash = TemporaryPassword.ExtractIfTemporary(existingAccount.PasswordHash);
            if (!_passwordService.VerifyPassword(existingAccount, storedPasswordHash, request.Password))
            {
                return BadRequest("Email ou mot de passe invalide.");
            }

            account = existingAccount;
            account.DisplayName = invitation.DisplayName;
            account.Role = invitation.Role;
            account.IsActive = true;
        }

        invitation.Status = InvitationStatuses.Accepted;
        invitation.AcceptedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var jwt = _jwtTokenGenerator.GenerateToken(account.Id, account.CompanyId, account.Role);
        _authCookieService.AppendAuthCookies(HttpContext, jwt.Token, jwt.ExpiresAt);
        _logger.LogInformation(
            "Security audit: invitation accepted for account {AccountId} in company {CompanyId} from IP {ClientIp}.",
            account.Id,
            account.CompanyId,
            HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");

        return Ok(new LoginResponse(
            jwt.Token,
            account.Id,
            account.CompanyId,
            invitation.Company.Name,
            _jwtOptions.ExpiresMinutes,
            account.Role,
            account.DisplayName));
    }

    private static InvitationResponse ToResponse(Invitation invitation, string companyName)
        => new(
            invitation.Id,
            invitation.CompanyId,
            companyName,
            invitation.Email,
            invitation.DisplayName,
            invitation.Role.ToUpperInvariant(),
            invitation.Status,
            invitation.CreatedAt,
            invitation.ExpiresAt,
            invitation.AcceptedAt,
            invitation.CreatedByAccountId,
            invitation.RevokedAt,
            $"/invite/{invitation.Token}");

    private static InvitationTokenResponse ToTokenResponse(Invitation invitation, string companyName)
        => new(
            invitation.Id,
            companyName,
            invitation.Email,
            invitation.DisplayName,
            invitation.Role.ToUpperInvariant(),
            invitation.Status,
            invitation.ExpiresAt);

    private static bool RefreshStatus(Invitation invitation)
    {
        if (invitation.Status == InvitationStatuses.Pending && invitation.ExpiresAt <= DateTime.UtcNow)
        {
            invitation.Status = InvitationStatuses.Expired;
            return true;
        }

        return false;
    }

    private static string GetInvitationUnavailableMessage(string status)
        => status switch
        {
            InvitationStatuses.Accepted => "Cette invitation a déjà été acceptée.",
            InvitationStatuses.Revoked => "Cette invitation a été annulée.",
            InvitationStatuses.Expired => "Cette invitation a expiré.",
            _ => "Cette invitation n’est plus disponible."
        };

    private static string GenerateToken()
    {
        Span<byte> buffer = stackalloc byte[32];
        RandomNumberGenerator.Fill(buffer);
        return Convert.ToHexString(buffer).ToLowerInvariant();
    }
}
