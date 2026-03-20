using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;

namespace SaveTheStock.Application.Catalog.Products.Update;

/// <summary>
/// Use case for updating an existing product.
/// </summary>
public sealed class UpdateProductUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateProductUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UpdateProductResult> ExecuteAsync(
        UpdateProductInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        var product = await _db.FindProductByIdAndCompanyIdAsync(
            input.ProductId,
            companyId.Value,
            cancellationToken);

        if (product is null)
            throw new InvalidOperationException("not_found");

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
            excludeProductId: product.Id,
            cancellationToken);

        if (exists)
            throw new InvalidOperationException("duplicate_name");

        product.Name = normalizedName;
        product.Unit = unit;
        product.CategoryId = input.CategoryId;
        product.AlertThreshold = input.AlertThreshold;
        product.IsActive = input.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new UpdateProductResult(
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