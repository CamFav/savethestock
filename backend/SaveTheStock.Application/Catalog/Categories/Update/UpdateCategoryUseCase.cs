using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;

namespace SaveTheStock.Application.Catalog.Categories.Update;

/// <summary>
/// Use case for updating a category.
/// </summary>
public sealed class UpdateCategoryUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateCategoryUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(
        Guid categoryId,
        UpdateCategoryInput input,
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

        var category = await _db.FindCategoryByIdAndCompanyIdAsync(
            categoryId,
            companyId.Value,
            cancellationToken);

        if (category is null)
            throw new InvalidOperationException("not_found");

        var exists = await _db.CategoryNameExistsAsync(
            companyId.Value,
            normalizedName,
            excludeCategoryId: categoryId,
            cancellationToken);

        if (exists)
            throw new InvalidOperationException("duplicate_name");

        // Update
        category.Name = normalizedName;

        await _db.SaveChangesAsync(cancellationToken);
    }
}