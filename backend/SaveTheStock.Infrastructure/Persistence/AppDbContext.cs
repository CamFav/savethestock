using Microsoft.EntityFrameworkCore;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Infrastructure.Persistence;

/// <summary>
/// Represents the database session and provides access to all persisted entities.
/// </summary>
public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Reception> Receptions => Set<Reception>();

    public DbSet<Lot> Lots => Set<Lot>();

    public void AddAccount(Account account)
    {
        Accounts.Add(account);
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
}
