using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Application.Catalog.Products.Create;

namespace SaveTheStock.Application.Catalog.Products.Create;

/// <summary>
/// Use case for creating a new product within the catalog.
/// </summary>
public sealed class CreateProductUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateProductUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateProductResult> ExecuteAsync(
        CreateProductInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        var normalizedName = NameNormalizer.Normalize(input.Name);
        if (string.IsNullOrWhiteSpace(normalizedName))
            throw new InvalidOperationException("Name is required.");

        if (normalizedName.Length > 100)
            throw new InvalidOperationException("Name is too long.");

        var unit = input.Unit?.Trim();
        if (string.IsNullOrWhiteSpace(unit))
            throw new InvalidOperationException("Unit is required.");

        if (unit.Length > 20)
            throw new InvalidOperationException("Unit is too long.");

        var categoryExists = await _db.CategoryExistsForCompanyAsync(
            input.CategoryId,
            companyId.Value,
            cancellationToken);

        if (!categoryExists)
            throw new InvalidOperationException("not_found");

        var exists = await _db.ProductNameExistsAsync(
            companyId.Value,
            normalizedName,
            excludeProductId: null,
            cancellationToken);

        if (exists)
            throw new InvalidOperationException("duplicate_name");

        var now = DateTime.UtcNow;

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId.Value,
            CategoryId = input.CategoryId,
            Name = normalizedName,
            Unit = unit,
            AlertThreshold = input.AlertThreshold,
            IsActive = input.IsActive,
            CreatedAt = now,
            DeletedAt = null
        };

        _db.AddProduct(product);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateProductResult(
            product.Id,
            product.CompanyId,
            product.CategoryId,
            product.Name,
            product.Unit,
            product.AlertThreshold,
            product.IsActive,
            product.CreatedAt);
    }
}