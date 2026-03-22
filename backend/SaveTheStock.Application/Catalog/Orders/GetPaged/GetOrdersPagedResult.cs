using SaveTheStock.Application.Catalog.Orders.Common;

namespace SaveTheStock.Application.Catalog.Orders.GetPaged;

public sealed record GetOrdersPagedResult(
    IReadOnlyList<OrderView> Items,
    int Page,
    int PageSize,
    int Total);
