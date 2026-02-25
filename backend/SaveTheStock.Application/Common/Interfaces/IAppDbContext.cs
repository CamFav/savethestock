using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Common.Interfaces;

/// <summary>
/// Interface for the application's database context :
/// methods for account management and data persistence.
/// </summary>
public interface IAppDbContext
{
    void AddAccount(Account account);

    Task<Account?> FindActiveAccountByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<Account?> FindAccountByIdAndCompanyIdAsync(Guid accountId, Guid companyId, CancellationToken cancellationToken);
    Task<bool> AccountEmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
