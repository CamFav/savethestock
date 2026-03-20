using SaveTheStock.Domain.Entities;
using SaveTheStock.Application.Catalog.Dashboard;
using SaveTheStock.Application.Catalog.Operational;
using System.Data;

namespace SaveTheStock.Application.Common.Interfaces;

/// <summary>
/// Interface for the application's database context :
/// methods for account management and data persistence.
/// </summary>
public interface IAppDbContext
{
    // Companies
    void AddCompany(Company company);

    // Accounts
    void AddAccount(Account account);
    void AddInvitation(Invitation invitation);
    void RemoveAccount(Account account);

    Task<Account?> FindActiveAccountByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<Account?> FindAccountByIdAndCompanyIdAsync(Guid accountId, Guid companyId, CancellationToken cancellationToken);
    Task<bool> AccountEmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<int> CountActiveOwnersAsync(Guid companyId, CancellationToken cancellationToken);
    Task<bool> AccountHasBusinessHistoryAsync(Guid companyId, Guid accountId, CancellationToken cancellationToken);

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

    // Stock - Receptions
    void AddReception(Reception reception);

    Task<Reception?> FindReceptionByIdAndCompanyIdAsync(
        Guid receptionId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<Reception> Items, int Total)> GetReceptionsPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<bool> ReceptionExistsForCompanyAsync(
        Guid receptionId,
        Guid companyId,
        CancellationToken cancellationToken);

    // Suppliers
    void AddSupplier(Supplier supplier);

    Task<Supplier?> FindSupplierByIdAndCompanyIdAsync(
        Guid supplierId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<bool> SupplierNameExistsAsync(
        Guid companyId,
        string normalizedName,
        Guid? excludeSupplierId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<Supplier> Items, int Total)> GetSuppliersPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    // Waste sessions
    void AddWasteSession(WasteSession wasteSession);
    void RemoveWasteSession(WasteSession wasteSession);
    void AddWasteLine(WasteLine wasteLine);
    void RemoveWasteLine(WasteLine wasteLine);

    Task<WasteSession?> FindWasteSessionByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken);
    Task<WasteSessionReadModel?> FindWasteSessionReadModelByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken);
    Task<WasteSession?> FindWasteSessionByIdAndCompanyIdForUpdateAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<WasteSession> Items, int Total)> GetWasteSessionsPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<(IReadOnlyList<WasteSessionReadModel> Items, int Total)> GetWasteSessionReadModelsPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<WasteLine?> FindWasteLineByIdAndCompanyIdAsync(
        Guid lineId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<WasteLine>> GetWasteLinesForSessionAsync(
        Guid sessionId,
        Guid companyId,
        CancellationToken cancellationToken);

    // Inventory
    void AddInventory(Inventory inventory);
    void AddInventoryLine(InventoryLine inventoryLine);
    void RemoveInventoryLine(InventoryLine inventoryLine);

    Task<Inventory?> FindInventoryByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken);
    Task<InventoryReadModel?> FindInventoryReadModelByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken);
    Task<Inventory?> FindInventoryByIdAndCompanyIdForUpdateAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<Inventory> Items, int Total)> GetInventoriesPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<(IReadOnlyList<InventoryReadModel> Items, int Total)> GetInventoryReadModelsPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<InventoryLine>> GetInventoryLinesAsync(
        Guid companyId,
        Guid inventoryId,
        CancellationToken cancellationToken);

    Task<InventoryLine?> FindInventoryLineByIdAndCompanyIdAsync(
        Guid lineId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<InventoryLine?> FindInventoryLineByInventoryAndProductAsync(
        Guid companyId,
        Guid inventoryId,
        Guid productId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Lot>> GetActiveLotsByProductAsync(
        Guid companyId,
        Guid productId,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<Lot>> GetActiveLotsByProductForUpdateAsync(
        Guid companyId,
        Guid productId,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<Lot>> GetLotsByIdsForUpdateAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> lotIds,
        CancellationToken cancellationToken);

    Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> operation,
        IsolationLevel isolationLevel,
        CancellationToken cancellationToken);
    Task DeleteCompanyDataAsync(Guid companyId, CancellationToken cancellationToken);

    // Dashboard
    Task<(decimal StockUsableValue, decimal StockExpiredValue, decimal StockTotalValue)> GetStockValuesAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken);

    Task<(decimal WasteValue, decimal WasteQty)> GetWasteTotalsAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken);

    Task<decimal> GetReceptionsValueAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken);

    Task<decimal> GetInventoryVarianceValueAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<WasteTrendPointData>> GetWasteTrendAsync(
        Guid companyId,
        DateOnly fromDate,
        DateOnly toDate,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TopWasteProductData>> GetTopWasteProductsAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<LowStockProductAlertData>> GetLowStockProductsAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken);

    Task<decimal> GetExpiredStockValueAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<LotAlertData>> GetExpiringLotsAsync(
        Guid companyId,
        DateOnly fromDate,
        DateOnly toDate,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<LotAlertData>> GetExpiredLotsAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken);

    // Operational
    Task<IReadOnlyList<OperationalLotItemData>> GetOperationalExpiringLotsAsync(
        Guid companyId,
        DateOnly today,
        DateOnly toDate,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<OperationalLotItemData>> GetOperationalExpiredLotsAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<OperationalLowStockProductData>> GetOperationalLowStockProductsAsync(
        Guid companyId,
        CancellationToken cancellationToken);

    // Persistence
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed record WasteSessionReadModel(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly WasteDate,
    string Status,
    string? Comment,
    DateTime CreatedAt,
    string? PostedByName);

public sealed record InventoryReadModel(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly InventoryDate,
    string Status,
    string? Comment,
    DateTime CreatedAt,
    string? PostedByName);
