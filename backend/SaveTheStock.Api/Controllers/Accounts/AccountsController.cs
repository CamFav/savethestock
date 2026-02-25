using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Infrastructure.Persistence;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Security;
using System.Security.Cryptography;

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
    private const string TempPasswordPrefix = "TEMP:";

    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<Account> _passwordHasher;

    private readonly ICurrentUser _currentUser;

    public AccountsController(
        AppDbContext dbContext,
        IPasswordHasher<Account> passwordHasher,
        ICurrentUser currentUser)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
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
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
        {
            return Unauthorized();
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailAlreadyUsed = await _dbContext.Accounts
            .AsNoTracking()
            .AnyAsync(a =>
                a.Email.ToLower() == normalizedEmail,
                cancellationToken);

        if (emailAlreadyUsed)
        {
            return BadRequest("An account with this email already exists.");
        }

        var temporaryPassword = GenerateTemporaryPassword(24);

        var account = new Account
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId.Value,
            Email = normalizedEmail,
            DisplayName = request.DisplayName.Trim(),
            Role = "Member",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        var hashed = _passwordHasher.HashPassword(account, temporaryPassword);
        account.PasswordHash = $"{TempPasswordPrefix}{hashed}";

        _dbContext.Accounts.Add(account);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = ToResponse(account);

        return CreatedAtAction(
            actionName: nameof(GetById),
            routeValues: new { id = account.Id },
            value: response);
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
            account.PasswordHash.StartsWith(TempPasswordPrefix, StringComparison.Ordinal);

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
    /// [DELETE] Soft deletes an account.
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

        if (account.Role == "Owner")
            return BadRequest("Owner account cannot be deleted.");

        if (account.DeletedAt != null)
            return NoContent();

        account.DeletedAt = DateTime.UtcNow;
        account.IsActive = false;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// [PUT] Changes the current account password.
    /// </summary>
    [HttpPut("me/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangeMyPassword(
        [FromBody] ChangeMyPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        var accountId = _currentUser.AccountId;
        if (companyId is null || accountId is null)
            return Unauthorized();

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a =>
                a.Id == accountId.Value &&
                a.CompanyId == companyId.Value,
                cancellationToken);

        if (account is null || account.DeletedAt != null)
            return NotFound();

        var hashed = _passwordHasher.HashPassword(account, request.NewPassword);

        account.PasswordHash = hashed;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
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
        var companyId = _currentUser.CompanyId;
        var accountId = _currentUser.AccountId;

        if (companyId is null || accountId is null)
            return Unauthorized();

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a =>
                a.Id == accountId.Value &&
                a.CompanyId == companyId.Value,
                cancellationToken);

        if (account is null || account.DeletedAt != null)
            return NotFound();

        // soft delete
        account.IsActive = false;
        account.DeletedAt = DateTime.UtcNow;

        // rgpd anonymization
        account.DisplayName = "Deleted User";
        account.Email = $"deleted-{account.Id}@example.invalid";

        // note: invalidate password hash
        // account.PasswordHash = null;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}

