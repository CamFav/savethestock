using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Infrastructure.Persistence;
using SaveTheStock.Domain.Entities;
using System.Security.Cryptography;

namespace SaveTheStock.Api.Controllers.Accounts;

[ApiController]
[Route("api/accounts")]
public sealed class AccountsController : ControllerBase
{
    private const string TempPasswordPrefix = "TEMP:";

    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<Account> _passwordHasher;

    public AccountsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
        _passwordHasher = new PasswordHasher<Account>();
    }

    /// <summary>
    /// [POST] Invites a new account to a company.
    /// </summary>
    [HttpPost("invite")]
    [ProducesResponseType(typeof(AccountResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AccountResponse>> InviteAccount(
        [FromQuery] Guid companyId,
        [FromBody] InviteAccountRequest request,
        CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
        {
            return BadRequest("companyId is required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailAlreadyUsed = await _dbContext.Accounts
            .AsNoTracking()
            .AnyAsync(a =>
                a.CompanyId == companyId &&
                a.DeletedAt == null &&
                a.Email.ToLower() == normalizedEmail,
                cancellationToken);

        if (emailAlreadyUsed)
        {
            return BadRequest("An account with this email already exists in this company.");
        }

        var temporaryPassword = GenerateTemporaryPassword(24);

        var account = new Account
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
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
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AccountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AccountResponse>> GetById(
        Guid id,
        [FromQuery] Guid companyId,
        CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest("companyId is required.");

        var account = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.Id == id &&
                a.CompanyId == companyId &&
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
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromQuery] Guid companyId,
        [FromBody] UpdateAccountRequest request,
        CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest("companyId is required.");

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (account is null)
            return NotFound();

        if (account.CompanyId != companyId)
            return NotFound();

        if (account.DeletedAt != null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var emailExists = await _dbContext.Accounts
                .AsNoTracking()
                .AnyAsync(a =>
                    a.CompanyId == companyId &&
                    a.Id != id &&
                    a.DeletedAt == null &&
                    a.Email.ToLower() == normalizedEmail,
                    cancellationToken);

            if (emailExists)
                return BadRequest("Email already used in this company.");

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
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SoftDelete(
        Guid id,
        [FromQuery] Guid companyId,
        CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest("companyId is required.");

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (account is null)
            return NotFound();

        if (account.CompanyId != companyId)
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
    public async Task<IActionResult> ChangeMyPassword(
        [FromQuery] Guid accountId,
        [FromBody] ChangeMyPasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (accountId == Guid.Empty)
            return BadRequest("accountId is required.");

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId, cancellationToken);

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
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AccountResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<AccountResponse>>> GetAll(
        [FromQuery] Guid companyId,
        CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
        {
            return BadRequest("companyId is required.");
        }

        var accounts = await _dbContext.Accounts
            .AsNoTracking()
            .Where(a =>
                a.CompanyId == companyId &&
                a.DeletedAt == null)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        var response = accounts
            .Select(ToResponse)
            .ToList()
            .AsReadOnly();

        return Ok(response);
    }
}

