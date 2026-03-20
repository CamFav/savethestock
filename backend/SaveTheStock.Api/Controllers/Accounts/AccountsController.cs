using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Infrastructure.Persistence;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Security;
using SaveTheStock.Application.Authentication;
using System.Security.Cryptography;
using SaveTheStock.Application.Accounts.InviteAccount;
using SaveTheStock.Application.Accounts.ChangeMyPassword;
using SaveTheStock.Application.Accounts.DeleteMyAccount;
using SaveTheStock.Application.Accounts.Delete;

namespace SaveTheStock.Api.Controllers.Accounts;

/// <summary>
/// Controller responsible for managing accounts within a company, 
/// including inviting new accounts, updating account details, soft deleting accounts, 
/// changing passwords, and retrieving account information.
/// </summary>
[ApiController]
[Route("api/accounts")]
[Authorize]
public sealed class AccountsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<Account> _passwordHasher;

    private readonly ICurrentUser _currentUser;

    private readonly InviteAccountUseCase _inviteAccount;
    private readonly ChangeMyPasswordUseCase _changeMyPassword;
    private readonly DeleteMyAccountUseCase _deleteMyAccount;
    private readonly DeleteAccountUseCase _deleteAccount;

    public AccountsController(
        AppDbContext dbContext,
        IPasswordHasher<Account> passwordHasher,
        ICurrentUser currentUser,
        InviteAccountUseCase inviteAccount,
        ChangeMyPasswordUseCase changeMyPassword,
        DeleteMyAccountUseCase deleteMyAccount,
        DeleteAccountUseCase deleteAccount)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
        _inviteAccount = inviteAccount;
        _changeMyPassword = changeMyPassword;
        _deleteMyAccount = deleteMyAccount;
        _deleteAccount = deleteAccount;
    }

    /// <summary>
    /// [POST] Invites a new account to a company.
    /// </summary>
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPost("invite")]
    [ProducesResponseType(typeof(AccountResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AccountResponse>> InviteAccount(
        [FromBody] InviteAccountRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var account = await _inviteAccount.ExecuteAsync(
                new InviteAccountCommand(request.Email, request.DisplayName),
                cancellationToken);

            var response = ToResponse(account);

            return CreatedAtAction(
                actionName: nameof(GetById),
                routeValues: new { id = account.Id },
                value: response);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// [GET] Retrieves the current account.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(AccountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccountResponse>> GetMe(CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        var accountId = _currentUser.AccountId;

        if (companyId is null || accountId is null)
            return Unauthorized();

        var account = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.Id == accountId.Value &&
                a.CompanyId == companyId.Value &&
                a.DeletedAt == null,
                cancellationToken);

        if (account is null)
            return NotFound();

        return Ok(ToResponse(account));
    }

    /// <summary>
    /// [GET] Retrieves an account by id.
    /// </summary>
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AccountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AccountResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            return Unauthorized();

        var account = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.Id == id &&
                a.CompanyId == companyId.Value &&
                a.DeletedAt == null,
                cancellationToken);

        if (account is null)
            return NotFound();

        return Ok(ToResponse(account));
    }

    private static AccountResponse ToResponse(Account account)
    {
        var mustChangePassword =
            account.PasswordHash != null &&
            account.PasswordHash.StartsWith(TemporaryPassword.Prefix, StringComparison.Ordinal);

        return new AccountResponse(
            account.Id,
            account.CompanyId,
            account.Email,
            account.DisplayName,
            account.Role,
            account.IsActive,
            account.CreatedAt,
            account.DeletedAt,
            mustChangePassword
        );
    }

    private static string GenerateTemporaryPassword(int length)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_";
        var buffer = new byte[length];

        RandomNumberGenerator.Fill(buffer);

        var result = new char[length];
        for (var i = 0; i < length; i++)
        {
            result[i] = chars[buffer[i] % chars.Length];
        }

        return new string(result);
    }

    /// <summary>
    /// [PUT] Updates an account.
    /// </summary>
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateAccountRequest request,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            return Unauthorized();

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a =>
                a.Id == id &&
                a.CompanyId == companyId.Value,
                cancellationToken);

        if (account is null)
            return NotFound();

        if (account.DeletedAt != null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var emailExists = await _dbContext.Accounts
                .AsNoTracking()
                .AnyAsync(a =>
                    a.Id != id &&
                    a.Email.ToLower() == normalizedEmail,
                    cancellationToken);

            if (emailExists)
                return BadRequest("Email already used.");

            account.Email = normalizedEmail;
        }

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            account.DisplayName = request.DisplayName.Trim();
        }

        if (request.IsActive.HasValue)
        {
            account.IsActive = request.IsActive.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// [DELETE] Deletes a member account.
    /// </summary>
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SoftDelete(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            await _deleteAccount.ExecuteDeleteMemberAsync(id, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "last_owner")
        {
            return BadRequest("Impossible de supprimer le dernier OWNER.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "owner_delete_not_allowed")
        {
            return BadRequest("Supprimez la société pour retirer le OWNER principal.");
        }
    }

    /// <summary>
    /// [POST] Changes the current account password.
    /// </summary>
    [HttpPost("me/change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangeMyPassword(
        [FromBody] ChangeMyPasswordRequest request,
        CancellationToken cancellationToken)
        => await ChangeMyPasswordInternal(request, cancellationToken);

    /// <summary>
    /// [PUT] Legacy route kept for compatibility.
    /// </summary>
    [HttpPut("me/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangeMyPasswordLegacy(
        [FromBody] ChangeMyPasswordRequest request,
        CancellationToken cancellationToken)
        => await ChangeMyPasswordInternal(request, cancellationToken);

    private async Task<IActionResult> ChangeMyPasswordInternal(
        ChangeMyPasswordRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _changeMyPassword.ExecuteAsync(
                new ChangeMyPasswordInput(
                    request.CurrentPassword,
                    request.NewPassword,
                    request.ConfirmNewPassword),
                cancellationToken);

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "current_password_required")
        {
            return BadRequest("Le mot de passe actuel est requis.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "new_password_required")
        {
            return BadRequest("Le nouveau mot de passe est requis.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "new_password_too_short")
        {
            return BadRequest("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "confirm_password_required")
        {
            return BadRequest("La confirmation du nouveau mot de passe est requise.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "password_confirmation_mismatch")
        {
            return BadRequest("La confirmation du nouveau mot de passe ne correspond pas.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_current_password")
        {
            return BadRequest("Le mot de passe actuel est incorrect.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "same_password_not_allowed")
        {
            return BadRequest("Le nouveau mot de passe doit être différent de l'ancien.");
        }
    }

    /// <summary>
    /// [GET] Retrieves all accounts.
    /// </summary>
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AccountResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<AccountResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
        {
            return Unauthorized();
        }

        var accounts = await _dbContext.Accounts
            .AsNoTracking()
            .Where(a =>
                a.CompanyId == companyId.Value &&
                a.DeletedAt == null)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        var response = accounts
            .Select(ToResponse)
            .ToList()
            .AsReadOnly();

        return Ok(response);
    }

    /// <summary>
    /// [DELETE] Self delete account (soft delete + anonymization).
    /// </summary>
    [HttpDelete("me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMyAccount(CancellationToken cancellationToken)
    {
        try
        {
            await _deleteMyAccount.ExecuteAsync(cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "owner_self_delete_not_allowed")
        {
            return BadRequest("Un OWNER ne peut pas supprimer son compte directement. Supprimez la société si nécessaire.");
        }
    }
}

