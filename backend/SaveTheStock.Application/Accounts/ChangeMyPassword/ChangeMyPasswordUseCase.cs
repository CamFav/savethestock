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

        if (string.IsNullOrWhiteSpace(input.CurrentPassword))
            throw new InvalidOperationException("current_password_required");

        if (string.IsNullOrWhiteSpace(input.NewPassword))
            throw new InvalidOperationException("new_password_required");

        if (input.NewPassword.Length < 8)
            throw new InvalidOperationException("new_password_too_short");

        if (string.IsNullOrWhiteSpace(input.ConfirmNewPassword))
            throw new InvalidOperationException("confirm_password_required");

        if (!string.Equals(input.NewPassword, input.ConfirmNewPassword, StringComparison.Ordinal))
            throw new InvalidOperationException("password_confirmation_mismatch");

        var account = await _db.FindAccountByIdAndCompanyIdAsync(accountId.Value, companyId.Value, cancellationToken);

        if (account is null || account.DeletedAt != null)
            throw new UnauthorizedAccessException("Account not found or deleted.");

        var storedPasswordHash = TemporaryPassword.ExtractIfTemporary(account.PasswordHash ?? string.Empty);

        if (string.IsNullOrWhiteSpace(storedPasswordHash) ||
            !_passwordService.VerifyPassword(account, storedPasswordHash, input.CurrentPassword))
        {
            throw new InvalidOperationException("invalid_current_password");
        }

        if (string.Equals(input.CurrentPassword, input.NewPassword, StringComparison.Ordinal))
            throw new InvalidOperationException("same_password_not_allowed");

        // Hash the new password
        var newHash = _passwordService.HashPassword(account, input.NewPassword);

        account.PasswordHash = newHash;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
