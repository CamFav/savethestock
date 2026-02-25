using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Authentication;

namespace SaveTheStock.Application.Accounts.ChangeMyPassword;

/// <summary>
/// UseCase to change the password of the authenticated user.
/// Removes the temporary password prefix if present.
/// </summary>
public sealed class ChangeMyPasswordUseCase
{
    private readonly ICurrentUser _currentUser;
    private readonly IAppDbContext _db;
    private readonly IPasswordService _passwordService;

    public ChangeMyPasswordUseCase(
        ICurrentUser currentUser,
        IAppDbContext db,
        IPasswordService passwordService)
    {
        _currentUser = currentUser;
        _db = db;
        _passwordService = passwordService;
    }

    /// <summary>
    /// Changes the password of the authenticated user.
    /// </summary>
    public async Task ExecuteAsync(ChangeMyPasswordInput input, CancellationToken cancellationToken)
    {
        var accountId = _currentUser.AccountId;
        var companyId = _currentUser.CompanyId;

        if (accountId is null || companyId is null)
            throw new UnauthorizedAccessException("Missing account_id or company_id claim.");

        var account = await _db.FindAccountByIdAndCompanyIdAsync(accountId.Value, companyId.Value, cancellationToken);

        if (account is null || account.DeletedAt != null)
            throw new UnauthorizedAccessException("Account not found or deleted.");

        // Hash the new password
        var newHash = _passwordService.HashPassword(account, input.NewPassword);

        // Set new password (no need to strip TEMP prefix, new hash won't have it)
        account.PasswordHash = newHash;

        await _db.SaveChangesAsync(cancellationToken);
    }
}

