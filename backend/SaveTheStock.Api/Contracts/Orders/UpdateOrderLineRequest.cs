namespace SaveTheStock.Api.Contracts.Orders;

public sealed record UpdateOrderLineRequest(
    decimal QuantityOrdered,
    decimal? UnitPrice);
