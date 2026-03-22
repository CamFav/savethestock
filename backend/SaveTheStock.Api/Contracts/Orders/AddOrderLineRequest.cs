namespace SaveTheStock.Api.Contracts.Orders;

public sealed record AddOrderLineRequest(
    Guid ProductId,
    decimal? Quantity,
    decimal? UnitPrice);
