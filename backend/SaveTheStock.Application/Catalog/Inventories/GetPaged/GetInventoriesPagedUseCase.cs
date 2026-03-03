using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Inventories.GetPaged;

public sealed class GetInventoriesPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetInventoriesPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetInventoriesPagedResult> ExecuteAsync(
        GetInventoriesPagedInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var page = input.Page <= 0 ? 1 : input.Page;
        var pageSize = input.PageSize <= 0 ? 20 : input.PageSize;

        var (items, total) = await _db.GetInventoriesPagedAsync(
            companyId,
            input.From,
            input.To,
            input.Status,
            page,
            pageSize,
            cancellationToken);

        var mapped = items.Select(x => new InventoryItem(
            x.Id,
            x.CompanyId,
            x.AccountId,
            x.InventoryDate,
            x.Status,
            x.Comment,
            x.CreatedAt)).ToList();

        return new GetInventoriesPagedResult(mapped, page, pageSize, total);
    }
}
