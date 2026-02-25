using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Accounts.DeleteMyAccount;

/// <summary>
/// UseCase to delete the authenticated user's account.
/// </summary>
public sealed class DeleteMyAccountUseCase
{
    private readonly ICurrentUser _currentUser;
    private readonly IAppDbContext _db;

    public DeleteMyAccountUseCase(
        ICurrentUser currentUser,
        IAppDbContext db)
    {
        _currentUser = currentUser;
        _db = db;
    }

    /// <summary>
    /// Deletes the authenticated user's account with anonymization.
    /// Performs soft delete (IsActive = false, DeletedAt = now) and anonymizes personal data.
    /// </summary>
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var accountId = _currentUser.AccountId;
        var companyId = _currentUser.CompanyId;

        if (accountId is null || companyId is null)
            throw new UnauthorizedAccessException("Missing account_id or company_id claim.");

        var account = await _db.FindAccountByIdAndCompanyIdAsync(accountId.Value, companyId.Value, cancellationToken);

        if (account is null || account.DeletedAt != null)
            throw new UnauthorizedAccessException("Account not found or already deleted.");

        // Soft delete + anonymization
        account.IsActive = false;
        account.DeletedAt = DateTime.UtcNow;
        account.DisplayName = "Deleted User";
        account.Email = $"deleted-{account.Id}@example.invalid";

        await _db.SaveChangesAsync(cancellationToken);
    }
}

