using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Categories.Delete;

/// <summary>
/// Use case for deleting a category.
/// </summary>
public sealed class DeleteCategoryUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteCategoryUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        // active categories are returned by FindCategoryByIdAndCompanyIdAsync
        var category = await _db.FindCategoryByIdAndCompanyIdAsync(
            categoryId,
            companyId.Value,
            cancellationToken);

        if (category is null)
            return;

        category.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}