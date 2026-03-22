using Microsoft.EntityFrameworkCore;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Catalog.Dashboard;
using SaveTheStock.Application.Catalog.Operational;
using System.Data;

namespace SaveTheStock.Infrastructure.Persistence;

/// <summary>
/// Represents the database session and provides access to all persisted entities.
/// </summary>
public class AppDbContext : DbContext, IAppDbContext
{
    private bool IsInMemoryProvider =>
        Database.ProviderName?.Contains("InMemory", StringComparison.OrdinalIgnoreCase) == true;

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<Reception> Receptions => Set<Reception>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Lot> Lots => Set<Lot>();
    public DbSet<WasteSession> WasteSessions => Set<WasteSession>();
    public DbSet<WasteLine> WasteLines => Set<WasteLine>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<InventoryLine> InventoryLines => Set<InventoryLine>();
    public DbSet<Invitation> Invitations => Set<Invitation>();

    public void AddCompany(Company company)
    {
        Companies.Add(company);
    }

    public void AddAccount(Account account)
    {
        Accounts.Add(account);
    }

    public void RemoveAccount(Account account)
    {
        Accounts.Remove(account);
    }

    public void AddInvitation(Invitation invitation)
    {
        Invitations.Add(invitation);
    }

    public void AddOrder(Order order)
    {
        Orders.Add(order);
    }

    public void AddOrderLine(OrderLine orderLine)
    {
        OrderLines.Add(orderLine);
    }

    public void RemoveOrder(Order order)
    {
        Orders.Remove(order);
    }

    public void RemoveOrderLine(OrderLine orderLine)
    {
        OrderLines.Remove(orderLine);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
        
    }

    public Task<bool> AccountEmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        return Accounts.AsNoTracking().AnyAsync(a => a.Email == normalizedEmail, cancellationToken);
    }

    public Task<Account?> FindActiveAccountByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        return Accounts
            .AsNoTracking()
            .Include(a => a.Company)
            .FirstOrDefaultAsync(a =>
                a.IsActive &&
                a.DeletedAt == null &&
                a.Email == normalizedEmail,
                cancellationToken);
    }

    public Task<Account?> FindAccountByIdAndCompanyIdAsync(Guid accountId, Guid companyId, CancellationToken cancellationToken)
    {
        return Accounts
            .FirstOrDefaultAsync(a =>
                a.Id == accountId &&
                a.CompanyId == companyId,
                cancellationToken);
    }

    public Task<int> CountActiveOwnersAsync(Guid companyId, CancellationToken cancellationToken)
    {
        return Accounts
            .AsNoTracking()
            .CountAsync(a =>
                a.CompanyId == companyId &&
                a.DeletedAt == null &&
                a.IsActive &&
                a.Role == "Owner",
                cancellationToken);
    }

    public async Task<bool> AccountHasBusinessHistoryAsync(Guid companyId, Guid accountId, CancellationToken cancellationToken)
    {
        var hasOrder = await Orders
            .AsNoTracking()
            .AnyAsync(o => o.CompanyId == companyId && o.AccountId == accountId, cancellationToken);

        if (hasOrder)
        {
            return true;
        }

        var hasReception = await Receptions
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(r => r.CompanyId == companyId && r.AccountId == accountId, cancellationToken);

        if (hasReception)
        {
            return true;
        }

        var hasInventory = await Inventories
            .AsNoTracking()
            .AnyAsync(i =>
                i.CompanyId == companyId &&
                (i.AccountId == accountId || i.PostedByAccountId == accountId),
                cancellationToken);

        if (hasInventory)
        {
            return true;
        }

        return await WasteSessions
            .AsNoTracking()
            .AnyAsync(ws =>
                ws.CompanyId == companyId &&
                (ws.AccountId == accountId || ws.PostedByAccountId == accountId),
                cancellationToken);
    }

    public Task<Order?> FindDraftOrderByCompanyIdAsync(Guid companyId, CancellationToken cancellationToken)
    {
        return Orders
            .Include(o => o.Lines)
            .Include(o => o.Receptions)
            .FirstOrDefaultAsync(
                o => o.CompanyId == companyId && o.Status == "DRAFT",
                cancellationToken);
    }

    public Task<Order?> FindOrderByIdAndCompanyIdAsync(Guid orderId, Guid companyId, CancellationToken cancellationToken)
    {
        return Orders
            .AsNoTracking()
            .Include(o => o.Lines)
            .Include(o => o.Receptions)
            .FirstOrDefaultAsync(
                o => o.Id == orderId && o.CompanyId == companyId,
                cancellationToken);
    }

    public Task<Order?> FindOrderByIdAndCompanyIdForUpdateAsync(Guid orderId, Guid companyId, CancellationToken cancellationToken)
    {
        return Orders
            .Include(o => o.Lines)
            .Include(o => o.Receptions)
            .FirstOrDefaultAsync(
                o => o.Id == orderId && o.CompanyId == companyId,
                cancellationToken);
    }

    public Task<OrderLine?> FindOrderLineByIdAndCompanyIdAsync(Guid orderLineId, Guid companyId, CancellationToken cancellationToken)
    {
        return OrderLines.FirstOrDefaultAsync(
            line => line.Id == orderLineId && line.CompanyId == companyId,
            cancellationToken);
    }

    public Task<int> CountOrdersForDateAsync(Guid companyId, DateOnly orderDate, CancellationToken cancellationToken)
    {
        return Orders
            .AsNoTracking()
            .CountAsync(o => o.CompanyId == companyId && o.OrderDate == orderDate, cancellationToken);
    }

    public async Task<(IReadOnlyList<Order> Items, int Total)> GetOrdersPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Orders
            .AsNoTracking()
            .Where(o => o.CompanyId == companyId);

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .Include(o => o.Lines)
            .Include(o => o.Receptions)
            .OrderByDescending(o => o.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public void AddCategory(Category category)
    {
        Categories.Add(category);
    }

    public Task<Category?> FindCategoryByIdAndCompanyIdAsync(
        Guid categoryId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Categories
            .FirstOrDefaultAsync(c =>
                c.Id == categoryId &&
                c.CompanyId == companyId &&
                c.DeletedAt == null,
                cancellationToken);
    }

    public Task<bool> CategoryNameExistsAsync(
        Guid companyId,
        string normalizedName,
        Guid? excludeCategoryId,
        CancellationToken cancellationToken)
    {
        var query = Categories
            .AsNoTracking()
            .Where(c =>
                c.CompanyId == companyId &&
                c.DeletedAt == null &&
                c.Name == normalizedName);

        if (excludeCategoryId.HasValue)
        {
            query = query.Where(c => c.Id != excludeCategoryId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Category> Items, int Total)> GetCategoriesPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Categories
            .AsNoTracking()
            .Where(c =>
                c.CompanyId == companyId &&
                c.DeletedAt == null);

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public void AddProduct(Product product)
    {
        Products.Add(product);
    }

    public Task<Product?> FindProductByIdAndCompanyIdAsync(
        Guid productId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Products
            .FirstOrDefaultAsync(p =>
                p.Id == productId &&
                p.CompanyId == companyId &&
                p.DeletedAt == null,
                cancellationToken);
    }

    public Task<bool> ProductNameExistsAsync(
        Guid companyId,
        string normalizedName,
        Guid? excludeProductId,
        CancellationToken cancellationToken)
    {
        var query = Products
            .AsNoTracking()
            .Where(p =>
                p.CompanyId == companyId &&
                p.DeletedAt == null &&
                p.Name == normalizedName);

        if (excludeProductId.HasValue)
        {
            query = query.Where(p => p.Id != excludeProductId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task<bool> CategoryExistsForCompanyAsync(
        Guid categoryId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Categories
            .AsNoTracking()
            .AnyAsync(c =>
                c.Id == categoryId &&
                c.CompanyId == companyId &&
                c.DeletedAt == null,
                cancellationToken);
    }

    public async Task<(IReadOnlyList<Product> Items, int Total)> GetProductsPagedAsync(
        Guid companyId,
        Guid? categoryId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Products
            .AsNoTracking()
            .Where(p =>
                p.CompanyId == companyId &&
                p.DeletedAt == null);

        if (categoryId.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.CategoryId == categoryId.Value);
        }

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public void AddLot(Lot lot)
    {
        Lots.Add(lot);
    }

    public Task<Lot?> FindLotByIdAndCompanyIdAsync(
        Guid lotId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Lots
            .FirstOrDefaultAsync(l =>
                l.Id == lotId &&
                l.CompanyId == companyId &&
                l.DeletedAt == null,
                cancellationToken);
    }

    public async Task<(IReadOnlyList<Lot> Items, int Total)> GetLotsPagedAsync(
        Guid companyId,
        Guid? productId,
        Guid? receptionId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Lots
            .AsNoTracking()
            .Where(l =>
                l.CompanyId == companyId &&
                l.DeletedAt == null);

        if (productId.HasValue)
        {
            baseQuery = baseQuery.Where(l => l.ProductId == productId.Value);
        }

        if (receptionId.HasValue)
        {
            baseQuery = baseQuery.Where(l => l.ReceptionId == receptionId.Value);
        }

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<bool> ProductExistsForCompanyAsync(
        Guid productId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Products
            .AsNoTracking()
            .AnyAsync(p =>
                p.Id == productId &&
                p.CompanyId == companyId &&
                p.DeletedAt == null,
                cancellationToken);
    }

    public void AddReception(Reception reception)
    {
        Receptions.Add(reception);
    }

    public Task<Reception?> FindReceptionByIdAndCompanyIdAsync(
        Guid receptionId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Receptions.FirstOrDefaultAsync(r =>
            r.Id == receptionId &&
            r.CompanyId == companyId &&
            r.DeletedAt == null,
            cancellationToken);
    }

    public async Task<(IReadOnlyList<Reception> Items, int Total)> GetReceptionsPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Receptions
            .AsNoTracking()
            .Where(r =>
                r.CompanyId == companyId &&
                r.DeletedAt == null);

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderByDescending(r => r.ReceptionDate)
            .ThenByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<bool> ReceptionExistsForCompanyAsync(
        Guid receptionId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Receptions
            .AsNoTracking()
            .AnyAsync(r =>
                r.Id == receptionId &&
                r.CompanyId == companyId &&
                r.DeletedAt == null,
                cancellationToken);
    }

    public void AddSupplier(Supplier supplier)
    {
        Suppliers.Add(supplier);
    }

    public Task<Supplier?> FindSupplierByIdAndCompanyIdAsync(
        Guid supplierId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Suppliers.FirstOrDefaultAsync(s =>
            s.Id == supplierId &&
            s.CompanyId == companyId &&
            s.DeletedAt == null,
            cancellationToken);
    }

    public Task<bool> SupplierNameExistsAsync(
        Guid companyId,
        string normalizedName,
        Guid? excludeSupplierId,
        CancellationToken cancellationToken)
    {
        var query = Suppliers
            .AsNoTracking()
            .Where(s =>
                s.CompanyId == companyId &&
                s.DeletedAt == null &&
                s.Name == normalizedName);

        if (excludeSupplierId.HasValue)
            query = query.Where(s => s.Id != excludeSupplierId.Value);

        return query.AnyAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Supplier> Items, int Total)> GetSuppliersPagedAsync(
        Guid companyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Suppliers
            .AsNoTracking()
            .Where(s =>
                s.CompanyId == companyId &&
                s.DeletedAt == null);

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderBy(s => s.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public void AddWasteSession(WasteSession wasteSession)
    {
        WasteSessions.Add(wasteSession);
    }

    public void RemoveWasteSession(WasteSession wasteSession)
    {
        WasteSessions.Remove(wasteSession);
    }

    public void AddWasteLine(WasteLine wasteLine)
    {
        WasteLines.Add(wasteLine);
    }

    public void RemoveWasteLine(WasteLine wasteLine)
    {
        WasteLines.Remove(wasteLine);
    }

    public Task<WasteSession?> FindWasteSessionByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return WasteSessions
            .FirstOrDefaultAsync(ws =>
                ws.Id == id &&
                ws.CompanyId == companyId,
                cancellationToken);
    }

    public async Task<WasteSessionReadModel?> FindWasteSessionReadModelByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return await (
            from ws in WasteSessions.AsNoTracking()
            join account in Accounts.AsNoTracking()
                on new { Id = ws.PostedByAccountId, ws.CompanyId } equals new { Id = (Guid?)account.Id, account.CompanyId } into postedBy
            from account in postedBy.DefaultIfEmpty()
            where ws.Id == id
                  && ws.CompanyId == companyId
            select new WasteSessionReadModel(
                ws.Id,
                ws.CompanyId,
                ws.AccountId,
                ws.WasteDate,
                ws.Status,
                ws.Comment,
                ws.CreatedAt,
                account != null ? account.DisplayName : null)
        ).FirstOrDefaultAsync(cancellationToken);
    }

    public Task<WasteSession?> FindWasteSessionByIdAndCompanyIdForUpdateAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        if (IsInMemoryProvider)
        {
            return WasteSessions
                .FirstOrDefaultAsync(ws =>
                    ws.Id == id &&
                    ws.CompanyId == companyId,
                    cancellationToken);
        }

        return WasteSessions
            .FromSqlInterpolated($@"
                SELECT *
                FROM waste_session
                WHERE id = {id}
                  AND company_id = {companyId}
                FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<WasteSession> Items, int Total)> GetWasteSessionsPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = WasteSessions
            .AsNoTracking()
            .Where(ws => ws.CompanyId == companyId);

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(ws => ws.WasteDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(ws => ws.WasteDate <= to.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            baseQuery = baseQuery.Where(ws => ws.Status == normalizedStatus);
        }

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderByDescending(ws => ws.WasteDate)
            .ThenByDescending(ws => ws.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(IReadOnlyList<WasteSessionReadModel> Items, int Total)> GetWasteSessionReadModelsPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = WasteSessions
            .AsNoTracking()
            .Where(ws => ws.CompanyId == companyId);

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(ws => ws.WasteDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(ws => ws.WasteDate <= to.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            baseQuery = baseQuery.Where(ws => ws.Status == normalizedStatus);
        }

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await (
            from ws in baseQuery
                .OrderByDescending(x => x.WasteDate)
                .ThenByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
            join account in Accounts.AsNoTracking()
                on new { Id = ws.PostedByAccountId, ws.CompanyId } equals new { Id = (Guid?)account.Id, account.CompanyId } into postedBy
            from account in postedBy.DefaultIfEmpty()
            select new WasteSessionReadModel(
                ws.Id,
                ws.CompanyId,
                ws.AccountId,
                ws.WasteDate,
                ws.Status,
                ws.Comment,
                ws.CreatedAt,
                account != null ? account.DisplayName : null)
        ).ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<WasteLine?> FindWasteLineByIdAndCompanyIdAsync(
        Guid lineId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return WasteLines
            .FirstOrDefaultAsync(wl =>
                wl.Id == lineId &&
                wl.CompanyId == companyId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<WasteLine>> GetWasteLinesForSessionAsync(
        Guid sessionId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return await WasteLines
            .AsNoTracking()
            .Where(wl =>
                wl.CompanyId == companyId &&
                wl.WasteSessionId == sessionId)
            .OrderBy(wl => wl.Id)
            .ToListAsync(cancellationToken);
    }

    public void AddInventory(Inventory inventory)
    {
        Inventories.Add(inventory);
    }

    public void AddInventoryLine(InventoryLine inventoryLine)
    {
        InventoryLines.Add(inventoryLine);
    }

    public void RemoveInventoryLine(InventoryLine inventoryLine)
    {
        InventoryLines.Remove(inventoryLine);
    }

    public Task<Inventory?> FindInventoryByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return Inventories
            .FirstOrDefaultAsync(i =>
                i.Id == id &&
                i.CompanyId == companyId,
                cancellationToken);
    }

    public async Task<InventoryReadModel?> FindInventoryReadModelByIdAndCompanyIdAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return await (
            from inventory in Inventories.AsNoTracking()
            join account in Accounts.AsNoTracking()
                on new { Id = inventory.PostedByAccountId, inventory.CompanyId } equals new { Id = (Guid?)account.Id, account.CompanyId } into postedBy
            from account in postedBy.DefaultIfEmpty()
            where inventory.Id == id
                  && inventory.CompanyId == companyId
            select new InventoryReadModel(
                inventory.Id,
                inventory.CompanyId,
                inventory.AccountId,
                inventory.InventoryDate,
                inventory.Status,
                inventory.Comment,
                inventory.CreatedAt,
                account != null ? account.DisplayName : null)
        ).FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Inventory?> FindInventoryByIdAndCompanyIdForUpdateAsync(
        Guid id,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        if (IsInMemoryProvider)
        {
            return Inventories
                .FirstOrDefaultAsync(i =>
                    i.Id == id &&
                    i.CompanyId == companyId,
                    cancellationToken);
        }

        return Inventories
            .FromSqlInterpolated($@"
                SELECT *
                FROM inventory
                WHERE id = {id}
                  AND company_id = {companyId}
                FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Inventory> Items, int Total)> GetInventoriesPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Inventories
            .AsNoTracking()
            .Where(i => i.CompanyId == companyId);

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.InventoryDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.InventoryDate <= to.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            baseQuery = baseQuery.Where(i => i.Status == normalizedStatus);
        }

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderByDescending(i => i.InventoryDate)
            .ThenByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(IReadOnlyList<InventoryReadModel> Items, int Total)> GetInventoryReadModelsPagedAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = Inventories
            .AsNoTracking()
            .Where(i => i.CompanyId == companyId);

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.InventoryDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(i => i.InventoryDate <= to.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            baseQuery = baseQuery.Where(i => i.Status == normalizedStatus);
        }

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await (
            from inventory in baseQuery
                .OrderByDescending(x => x.InventoryDate)
                .ThenByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
            join account in Accounts.AsNoTracking()
                on new { Id = inventory.PostedByAccountId, inventory.CompanyId } equals new { Id = (Guid?)account.Id, account.CompanyId } into postedBy
            from account in postedBy.DefaultIfEmpty()
            select new InventoryReadModel(
                inventory.Id,
                inventory.CompanyId,
                inventory.AccountId,
                inventory.InventoryDate,
                inventory.Status,
                inventory.Comment,
                inventory.CreatedAt,
                account != null ? account.DisplayName : null)
        ).ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<InventoryLine>> GetInventoryLinesAsync(
        Guid companyId,
        Guid inventoryId,
        CancellationToken cancellationToken)
    {
        return await InventoryLines
            .Where(il =>
                il.CompanyId == companyId &&
                il.InventoryId == inventoryId)
            .OrderBy(il => il.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<InventoryLine?> FindInventoryLineByIdAndCompanyIdAsync(
        Guid lineId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return InventoryLines
            .FirstOrDefaultAsync(il =>
                il.Id == lineId &&
                il.CompanyId == companyId,
                cancellationToken);
    }

    public Task<InventoryLine?> FindInventoryLineByInventoryAndProductAsync(
        Guid companyId,
        Guid inventoryId,
        Guid productId,
        CancellationToken cancellationToken)
    {
        return InventoryLines
            .FirstOrDefaultAsync(il =>
                il.CompanyId == companyId &&
                il.InventoryId == inventoryId &&
                il.ProductId == productId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Lot>> GetActiveLotsByProductAsync(
        Guid companyId,
        Guid productId,
        CancellationToken cancellationToken)
    {
        return await Lots
            .Where(l =>
                l.CompanyId == companyId &&
                l.ProductId == productId &&
                l.DeletedAt == null)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Lot>> GetActiveLotsByProductForUpdateAsync(
        Guid companyId,
        Guid productId,
        CancellationToken cancellationToken)
    {
        if (IsInMemoryProvider)
        {
            return await Lots
                .Where(l =>
                    l.CompanyId == companyId &&
                    l.ProductId == productId &&
                    l.DeletedAt == null)
                .ToListAsync(cancellationToken);
        }

        // Raw SQL must use the physical PostgreSQL table name ("lots"), not the entity name ("Lot").
        return await Lots
            .FromSqlInterpolated($@"
                SELECT *
                FROM lots
                WHERE company_id = {companyId}
                  AND product_id = {productId}
                  AND deleted_at IS NULL
                FOR UPDATE")
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Lot>> GetLotsByIdsForUpdateAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> lotIds,
        CancellationToken cancellationToken)
    {
        var ids = lotIds
            .Distinct()
            .ToArray();

        if (ids.Length == 0)
            return [];

        if (IsInMemoryProvider)
        {
            return await Lots
                .Where(l =>
                    l.CompanyId == companyId &&
                    l.DeletedAt == null &&
                    ids.Contains(l.Id))
                .ToListAsync(cancellationToken);
        }

        return await Lots
            .FromSqlInterpolated($@"
                SELECT *
                FROM lots
                WHERE company_id = {companyId}
                  AND deleted_at IS NULL
                  AND id = ANY({ids})
                FOR UPDATE")
            .ToListAsync(cancellationToken);
    }

    public async Task<(decimal StockUsableValue, decimal StockExpiredValue, decimal StockTotalValue)> GetStockValuesAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var projection = await Lots
            .AsNoTracking()
            .Where(l =>
                l.CompanyId == companyId &&
                l.DeletedAt == null &&
                l.QuantityRemaining > 0)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                StockUsableValue = g
                    .Where(l =>
                        !l.HasIssue &&
                        (l.ExpiryDate == null || l.ExpiryDate >= today))
                    .Sum(l => (decimal?)(l.QuantityRemaining * l.UnitCost)) ?? 0m,
                StockExpiredValue = g
                    .Where(l => l.ExpiryDate != null && l.ExpiryDate < today)
                    .Sum(l => (decimal?)(l.QuantityRemaining * l.UnitCost)) ?? 0m,
                StockTotalValue = g
                    .Sum(l => (decimal?)(l.QuantityRemaining * l.UnitCost)) ?? 0m
            })
            .FirstOrDefaultAsync(cancellationToken);

        return projection is null
            ? (0m, 0m, 0m)
            : (projection.StockUsableValue, projection.StockExpiredValue, projection.StockTotalValue);
    }

    public async Task<(decimal WasteValue, decimal WasteQty)> GetWasteTotalsAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken)
    {
        var baseQuery =
            from wl in WasteLines.AsNoTracking()
            join ws in WasteSessions.AsNoTracking()
                on new { wl.CompanyId, Id = wl.WasteSessionId } equals new { ws.CompanyId, Id = ws.Id }
            join lot in Lots.AsNoTracking()
                on new { wl.CompanyId, Id = wl.LotId } equals new { lot.CompanyId, Id = lot.Id }
            where wl.CompanyId == companyId
                  && ws.Status == "POSTED"
                  && lot.DeletedAt == null
            select new
            {
                ws.WasteDate,
                wl.Quantity,
                WasteValue = wl.Quantity * lot.UnitCost
            };

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.WasteDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.WasteDate <= to.Value);
        }

        var projected = await baseQuery
            .GroupBy(_ => 1)
            .Select(g => new
            {
                WasteQty = g.Sum(x => x.Quantity),
                WasteValue = g.Sum(x => x.WasteValue)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return projected is null
            ? (0m, 0m)
            : (projected.WasteValue, projected.WasteQty);
    }

    public async Task<decimal> GetReceptionsValueAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken)
    {
        var baseQuery =
            from lot in Lots.AsNoTracking()
            join reception in Receptions.AsNoTracking()
                on lot.ReceptionId equals (Guid?)reception.Id
            where lot.CompanyId == companyId
                  && lot.DeletedAt == null
                  && lot.ReceptionId != null
                  && reception.CompanyId == companyId
                  && reception.DeletedAt == null
            select new
            {
                reception.ReceptionDate,
                ReceptionValue = lot.QuantityInitial * lot.UnitCost
            };

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.ReceptionDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.ReceptionDate <= to.Value);
        }

        var total = await baseQuery
            .SumAsync(x => (decimal?)x.ReceptionValue, cancellationToken);

        return total ?? 0m;
    }

    public async Task<decimal> GetInventoryVarianceValueAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken)
    {
        var baseQuery =
            from line in InventoryLines.AsNoTracking()
            join inventory in Inventories.AsNoTracking()
                on new { line.CompanyId, Id = line.InventoryId } equals new { inventory.CompanyId, Id = inventory.Id }
            join product in Products.AsNoTracking()
                on new { line.CompanyId, Id = line.ProductId } equals new { product.CompanyId, Id = product.Id }
            where line.CompanyId == companyId
                  && inventory.Status == "POSTED"
                  && product.DeletedAt == null
            select new
            {
                line.ProductId,
                line.RealQuantity,
                line.TheoreticalQuantity,
                inventory.InventoryDate
            };

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.InventoryDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.InventoryDate <= to.Value);
        }

        var lines = await baseQuery.ToListAsync(cancellationToken);

        if (lines.Count == 0)
        {
            return 0m;
        }

        var deltaByProduct = lines
            .GroupBy(x => x.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                AbsDelta = g.Sum(x => Math.Abs(x.RealQuantity - x.TheoreticalQuantity))
            })
            .ToList();

        var unitCostByProduct = await Lots
            .AsNoTracking()
            .Where(l =>
                l.CompanyId == companyId &&
                l.DeletedAt == null)
            .GroupBy(l => l.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                UnitCost = g.Average(x => x.UnitCost)
            })
            .ToDictionaryAsync(x => x.ProductId, x => x.UnitCost, cancellationToken);

        decimal total = 0m;
        foreach (var item in deltaByProduct)
        {
            if (!unitCostByProduct.TryGetValue(item.ProductId, out var unitCost))
                continue;

            total += item.AbsDelta * unitCost;
        }

        return total;
    }

    public async Task<IReadOnlyList<WasteTrendPointData>> GetWasteTrendAsync(
        Guid companyId,
        DateOnly fromDate,
        DateOnly toDate,
        CancellationToken cancellationToken)
    {
        var items = await (
            from wl in WasteLines.AsNoTracking()
            join ws in WasteSessions.AsNoTracking()
                on new { wl.CompanyId, Id = wl.WasteSessionId } equals new { ws.CompanyId, Id = ws.Id }
            join lot in Lots.AsNoTracking()
                on new { wl.CompanyId, Id = wl.LotId } equals new { lot.CompanyId, Id = lot.Id }
            where wl.CompanyId == companyId
                  && ws.Status == "POSTED"
                  && ws.WasteDate >= fromDate
                  && ws.WasteDate <= toDate
                  && lot.DeletedAt == null
            group new { wl, lot } by ws.WasteDate
            into g
            orderby g.Key
            select new WasteTrendPointData(
                g.Key,
                g.Sum(x => x.wl.Quantity * x.lot.UnitCost),
                g.Sum(x => x.wl.Quantity))
        ).ToListAsync(cancellationToken);

        return items;
    }

    public async Task<IReadOnlyList<TopWasteProductData>> GetTopWasteProductsAsync(
        Guid companyId,
        DateOnly? from,
        DateOnly? to,
        int limit,
        CancellationToken cancellationToken)
    {
        var baseQuery =
            from wl in WasteLines.AsNoTracking()
            join ws in WasteSessions.AsNoTracking()
                on new { wl.CompanyId, Id = wl.WasteSessionId } equals new { ws.CompanyId, Id = ws.Id }
            join lot in Lots.AsNoTracking()
                on new { wl.CompanyId, Id = wl.LotId } equals new { lot.CompanyId, Id = lot.Id }
            join product in Products.AsNoTracking()
                on new { lot.CompanyId, Id = lot.ProductId } equals new { product.CompanyId, Id = product.Id }
            where wl.CompanyId == companyId
                  && ws.Status == "POSTED"
                  && lot.DeletedAt == null
                  && product.DeletedAt == null
            select new
            {
                ws.WasteDate,
                product.Id,
                product.Name,
                wl.Quantity,
                WasteValue = wl.Quantity * lot.UnitCost
            };

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.WasteDate >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.WasteDate <= to.Value);
        }

        var grouped = await baseQuery
            .GroupBy(x => new { x.Id, x.Name })
            .Select(g => new
            {
                ProductId = g.Key.Id,
                ProductName = g.Key.Name,
                TotalWasteQty = g.Sum(x => x.Quantity),
                TotalWasteValue = g.Sum(x => x.WasteValue)
            })
            .OrderByDescending(x => x.TotalWasteValue)
            .ThenByDescending(x => x.TotalWasteQty)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return grouped
            .Select(x => new TopWasteProductData(
                x.ProductId,
                x.ProductName,
                x.TotalWasteQty,
                x.TotalWasteValue))
            .ToList();
    }

    public async Task<IReadOnlyList<LowStockProductAlertData>> GetLowStockProductsAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var items = await (
            from product in Products.AsNoTracking()
            where product.CompanyId == companyId
                  && product.DeletedAt == null
            let usableQty = (
                from lot in Lots.AsNoTracking()
                where lot.CompanyId == companyId
                      && lot.DeletedAt == null
                      && lot.ProductId == product.Id
                      && lot.QuantityRemaining > 0
                      && !lot.HasIssue
                      && (lot.ExpiryDate == null || lot.ExpiryDate >= today)
                select (decimal?)lot.QuantityRemaining
            ).Sum() ?? 0m
            where usableQty <= product.AlertThreshold
            orderby usableQty, product.Name
            select new LowStockProductAlertData(
                product.Id,
                product.Name,
                product.AlertThreshold,
                usableQty)
        ).ToListAsync(cancellationToken);

        return items;
    }

    public async Task<decimal> GetExpiredStockValueAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var total = await Lots
            .AsNoTracking()
            .Where(l =>
                l.CompanyId == companyId &&
                l.DeletedAt == null &&
                l.QuantityRemaining > 0 &&
                l.ExpiryDate != null &&
                l.ExpiryDate < today)
            .SumAsync(l => (decimal?)(l.QuantityRemaining * l.UnitCost), cancellationToken);

        return total ?? 0m;
    }

    public async Task<IReadOnlyList<LotAlertData>> GetExpiringLotsAsync(
        Guid companyId,
        DateOnly fromDate,
        DateOnly toDate,
        CancellationToken cancellationToken)
    {
        var items = await (
            from lot in Lots.AsNoTracking()
            join product in Products.AsNoTracking()
                on new { lot.CompanyId, Id = lot.ProductId } equals new { product.CompanyId, Id = product.Id }
            where lot.CompanyId == companyId
                  && lot.DeletedAt == null
                  && product.DeletedAt == null
                  && lot.QuantityRemaining > 0
                  && lot.ExpiryDate != null
                  && lot.ExpiryDate >= fromDate
                  && lot.ExpiryDate <= toDate
            orderby lot.ExpiryDate, product.Name
            select new LotAlertData(
                lot.Id,
                product.Id,
                product.Name,
                lot.LotCode,
                lot.ExpiryDate!.Value,
                lot.QuantityRemaining)
        ).ToListAsync(cancellationToken);

        return items;
    }

    public async Task<IReadOnlyList<LotAlertData>> GetExpiredLotsAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var items = await (
            from lot in Lots.AsNoTracking()
            join product in Products.AsNoTracking()
                on new { lot.CompanyId, Id = lot.ProductId } equals new { product.CompanyId, Id = product.Id }
            where lot.CompanyId == companyId
                  && lot.DeletedAt == null
                  && product.DeletedAt == null
                  && lot.QuantityRemaining > 0
                  && lot.ExpiryDate != null
                  && lot.ExpiryDate < today
            orderby lot.ExpiryDate, product.Name
            select new LotAlertData(
                lot.Id,
                product.Id,
                product.Name,
                lot.LotCode,
                lot.ExpiryDate!.Value,
                lot.QuantityRemaining)
        ).ToListAsync(cancellationToken);

        return items;
    }

    public async Task<IReadOnlyList<OperationalLotItemData>> GetOperationalExpiringLotsAsync(
        Guid companyId,
        DateOnly today,
        DateOnly toDate,
        CancellationToken cancellationToken)
    {
        var items = await (
            from lot in Lots.AsNoTracking()
            join product in Products.AsNoTracking()
                on new { lot.CompanyId, Id = lot.ProductId } equals new { product.CompanyId, Id = product.Id }
            where lot.CompanyId == companyId
                  && lot.DeletedAt == null
                  && product.DeletedAt == null
                  && lot.QuantityRemaining > 0
                  && lot.ExpiryDate != null
                  && lot.ExpiryDate >= today
                  && lot.ExpiryDate <= toDate
            orderby lot.ExpiryDate, lot.CreatedAt
            select new OperationalLotItemData(
                lot.Id,
                lot.LotCode,
                product.Id,
                product.Name,
                lot.ExpiryDate!.Value,
                lot.QuantityRemaining,
                lot.UnitCost,
                lot.QuantityRemaining * lot.UnitCost)
        ).ToListAsync(cancellationToken);

        return items;
    }

    public async Task<IReadOnlyList<OperationalLotItemData>> GetOperationalExpiredLotsAsync(
        Guid companyId,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        var items = await (
            from lot in Lots.AsNoTracking()
            join product in Products.AsNoTracking()
                on new { lot.CompanyId, Id = lot.ProductId } equals new { product.CompanyId, Id = product.Id }
            where lot.CompanyId == companyId
                  && lot.DeletedAt == null
                  && product.DeletedAt == null
                  && lot.QuantityRemaining > 0
                  && lot.ExpiryDate != null
                  && lot.ExpiryDate < today
            orderby lot.ExpiryDate, product.Name
            select new OperationalLotItemData(
                lot.Id,
                lot.LotCode,
                product.Id,
                product.Name,
                lot.ExpiryDate!.Value,
                lot.QuantityRemaining,
                lot.UnitCost,
                lot.QuantityRemaining * lot.UnitCost)
        ).ToListAsync(cancellationToken);

        return items;
    }

    public async Task<IReadOnlyList<OperationalLowStockProductData>> GetOperationalLowStockProductsAsync(
        Guid companyId,
        CancellationToken cancellationToken)
    {
        var items = await (
            from product in Products.AsNoTracking()
            where product.CompanyId == companyId
                  && product.DeletedAt == null
            let currentQty = (
                from lot in Lots.AsNoTracking()
                where lot.CompanyId == companyId
                      && lot.DeletedAt == null
                      && lot.ProductId == product.Id
                select (decimal?)lot.QuantityRemaining
            ).Sum() ?? 0m
            where currentQty <= product.AlertThreshold
            orderby currentQty, product.Name
            select new OperationalLowStockProductData(
                product.Id,
                product.Name,
                currentQty,
                product.AlertThreshold)
        ).ToListAsync(cancellationToken);

        return items;
    }

    public async Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> operation,
        IsolationLevel isolationLevel,
        CancellationToken cancellationToken)
    {
        if (IsInMemoryProvider)
        {
            await operation(cancellationToken);
            return;
        }

        await using var transaction = await Database.BeginTransactionAsync(isolationLevel, cancellationToken);
        await operation(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task DeleteCompanyDataAsync(Guid companyId, CancellationToken cancellationToken)
    {
        await ExecuteInTransactionAsync(async ct =>
        {
            var inventoryLines = await InventoryLines
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            InventoryLines.RemoveRange(inventoryLines);

            var wasteLines = await WasteLines
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            WasteLines.RemoveRange(wasteLines);

            var lots = await Lots
                .IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Lots.RemoveRange(lots);

            var inventories = await Inventories
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Inventories.RemoveRange(inventories);

            var wasteSessions = await WasteSessions
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            WasteSessions.RemoveRange(wasteSessions);

            var receptions = await Receptions
                .IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Receptions.RemoveRange(receptions);

            var orderLines = await OrderLines
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            OrderLines.RemoveRange(orderLines);

            var orders = await Orders
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Orders.RemoveRange(orders);

            var products = await Products
                .IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Products.RemoveRange(products);

            var categories = await Categories
                .IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Categories.RemoveRange(categories);

            var suppliers = await Suppliers
                .IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Suppliers.RemoveRange(suppliers);

            var invitations = await Invitations
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Invitations.RemoveRange(invitations);

            var accounts = await Accounts
                .Where(x => x.CompanyId == companyId)
                .ToListAsync(ct);
            Accounts.RemoveRange(accounts);

            var company = await Companies.FirstOrDefaultAsync(x => x.Id == companyId, ct);
            if (company is not null)
            {
                Companies.Remove(company);
            }

            await SaveChangesAsync(ct);
        }, IsolationLevel.Serializable, cancellationToken);
    }
}
