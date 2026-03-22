using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.GetPaged;

public sealed class GetOrdersPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetOrdersPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetOrdersPagedResult> ExecuteAsync(GetOrdersPagedInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var page = input.Page <= 0 ? 1 : input.Page;
        var pageSize = input.PageSize <= 0 ? 20 : input.PageSize;

        var (items, total) = await _db.GetOrdersPagedAsync(companyId, page, pageSize, cancellationToken);
        var mapped = items.Select(OrderMappings.ToView).ToList().AsReadOnly();

        return new GetOrdersPagedResult(mapped, page, pageSize, total);
    }
}
