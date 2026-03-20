using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Categories.Create;

/// <summary>
/// Use case for creating a new category within the catalog.
/// </summary>
public sealed class CreateCategoryUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateCategoryUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateCategoryResult> ExecuteAsync(
        CreateCategoryInput input,
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

        var exists = await _db.CategoryNameExistsAsync(
            companyId.Value,
            normalizedName,
            excludeCategoryId: null,
            cancellationToken);

        if (exists)
            throw new InvalidOperationException("duplicate_name");

        var now = DateTime.UtcNow;

        var category = new Category
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId.Value,
            Name = normalizedName,
            CreatedAt = now,
            DeletedAt = null
        };

        _db.AddCategory(category);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateCategoryResult(
            category.Id,
            category.CompanyId,
            category.Name,
            category.CreatedAt);
    }
}