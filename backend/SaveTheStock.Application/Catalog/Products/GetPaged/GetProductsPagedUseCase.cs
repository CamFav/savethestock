using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Products.GetPaged;

/// <summary>
/// Use case for retrieving a paged list of products.
/// </summary>
public sealed class GetProductsPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetProductsPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetProductsPagedResult> ExecuteAsync(
        GetProductsPagedInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        if (input.Page < 1)
            throw new InvalidOperationException("Page must be >= 1.");

        if (input.PageSize < 1)
            throw new InvalidOperationException("PageSize must be >= 1.");

        var pageSize = input.PageSize > 100 ? 100 : input.PageSize;

        // note : "categoryId invalid => not_found" ? check si existe ?
        var (items, total) = await _db.GetProductsPagedAsync(
            companyId.Value,
            input.CategoryId,
            input.Page,
            pageSize,
            cancellationToken);

        var mapped = items
            .Select(p => new GetProductsPagedItem(
                p.Id,
                p.CompanyId,
                p.CategoryId,
                p.Name,
                p.Unit,
                p.AlertThreshold,
                p.IsActive,
                p.CreatedAt))
            .ToList();

        return new GetProductsPagedResult(mapped, total, input.Page, pageSize);
    }
}