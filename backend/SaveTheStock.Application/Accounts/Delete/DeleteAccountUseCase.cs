using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Accounts.Delete;

public sealed class DeleteAccountUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteAccountUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteDeleteMyAccountAsync(CancellationToken cancellationToken)
    {
        var accountId = _currentUser.AccountId;
        var companyId = _currentUser.CompanyId;
        var role = _currentUser.Role;

        if (accountId is null || companyId is null)
            throw new UnauthorizedAccessException("Missing account_id or company_id claim.");

        if (string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("owner_self_delete_not_allowed");

        var account = await _db.FindAccountByIdAndCompanyIdAsync(accountId.Value, companyId.Value, cancellationToken);
        if (account is null || account.DeletedAt != null)
            throw new UnauthorizedAccessException("Account not found or already deleted.");

        await DeleteAccountInternalAsync(account, companyId.Value, cancellationToken);
    }

    public async Task ExecuteDeleteMemberAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException("Missing company_id claim.");

        var account = await _db.FindAccountByIdAndCompanyIdAsync(accountId, companyId.Value, cancellationToken);
        if (account is null)
            throw new InvalidOperationException("not_found");

        if (account.DeletedAt != null)
            return;

        if (string.Equals(account.Role, "Owner", StringComparison.OrdinalIgnoreCase))
        {
            var ownerCount = await _db.CountActiveOwnersAsync(companyId.Value, cancellationToken);
            if (ownerCount <= 1)
                throw new InvalidOperationException("last_owner");

            throw new InvalidOperationException("owner_delete_not_allowed");
        }

        await DeleteAccountInternalAsync(account, companyId.Value, cancellationToken);
    }

    private async Task DeleteAccountInternalAsync(Account account, Guid companyId, CancellationToken cancellationToken)
    {
        var hasBusinessHistory = await _db.AccountHasBusinessHistoryAsync(companyId, account.Id, cancellationToken);

        if (!hasBusinessHistory)
        {
            _db.RemoveAccount(account);
            await _db.SaveChangesAsync(cancellationToken);
            return;
        }

        account.IsActive = false;
        account.DeletedAt = DateTime.UtcNow;
        account.DisplayName = Account.DeletedDisplayName;
        account.Email = $"deleted-{account.Id}@example.invalid";
        account.PasswordHash = string.Empty;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
