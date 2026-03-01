using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Common.Interfaces;

/// <summary>
/// Interface for the application's database context :
/// methods for account management and data persistence.
/// </summary>
public interface IAppDbContext
{
    // Accounts
    void AddAccount(Account account);

    Task<Account?> FindActiveAccountByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<Account?> FindAccountByIdAndCompanyIdAsync(Guid accountId, Guid companyId, CancellationToken cancellationToken);
    Task<bool> AccountEmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);

    // Catalog - Categories
    void AddCategory(Category category);

    Task<Category?> FindCategoryByIdAndCompanyIdAsync(
        Guid categoryId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<bool> CategoryNameExistsAsync(
        Guid companyId,
        string normalizedName,
        Guid? excludeCategoryId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<Category> Items, int Total)> GetCategoriesPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    // Catalog - Products
    void AddProduct(Product product);

    Task<Product?> FindProductByIdAndCompanyIdAsync(
        Guid productId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<bool> ProductNameExistsAsync(
        Guid companyId,
        string normalizedName,
        Guid? excludeProductId,
        CancellationToken cancellationToken);

    Task<bool> CategoryExistsForCompanyAsync(
        Guid categoryId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<Product> Items, int Total)> GetProductsPagedAsync(
        Guid companyId,
        Guid? categoryId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    // Lots
    void AddLot(Lot lot);

    Task<Lot?> FindLotByIdAndCompanyIdAsync(
        Guid lotId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<Lot> Items, int Total)> GetLotsPagedAsync(
        Guid companyId,
        Guid? productId,
        Guid? receptionId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<bool> ProductExistsForCompanyAsync(
        Guid productId,
        Guid companyId,
        CancellationToken cancellationToken);

    // Persistence
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}