namespace SaveTheStock.Api.Contracts.Orders;

public sealed record PagedOrdersResponse(
    IReadOnlyList<OrderResponse> Items,
    int Page,
    int PageSize,
    int Total);
