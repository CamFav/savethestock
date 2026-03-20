using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Categories.GetMyById;

public sealed class GetMyCategoryByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetMyCategoryByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetMyCategoryByIdResult> ExecuteAsync(
        Guid categoryId,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        var category = await _db.FindCategoryByIdAndCompanyIdAsync(
            categoryId,
            companyId.Value,
            cancellationToken);

        if (category is null)
            throw new InvalidOperationException("not_found");

        return new GetMyCategoryByIdResult(
            category.Id,
            category.CompanyId,
            category.Name,
            category.CreatedAt);
    }
}