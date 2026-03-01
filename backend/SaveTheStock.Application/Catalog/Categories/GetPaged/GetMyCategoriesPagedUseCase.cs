using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Models;

namespace SaveTheStock.Application.Catalog.Categories.GetMyListPaged;

public sealed class GetMyCategoriesPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetMyCategoriesPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<GetMyCategoriesPagedResultItem>> ExecuteAsync(
        GetMyCategoriesPagedInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        var page = input.Page < 1 ? 1 : input.Page;
        var pageSize = input.PageSize < 1 ? 10 : input.PageSize;

        // Optional hard cap to protect API
        if (pageSize > 100) pageSize = 100;

        var (items, total) = await _db.GetCategoriesPagedAsync(
            companyId.Value,
            page,
            pageSize,
            cancellationToken);

        var mapped = items
            .Select(c => new GetMyCategoriesPagedResultItem(
                c.Id,
                c.CompanyId,
                c.Name,
                c.CreatedAt))
            .ToList()
            .AsReadOnly();

        return new PagedResult<GetMyCategoriesPagedResultItem>(
            mapped,
            total,
            page,
            pageSize);
    }
}