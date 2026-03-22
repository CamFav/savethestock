namespace SaveTheStock.Api.Contracts.Orders;

public sealed record AddProductToDraftOrderRequest(
    Guid ProductId,
    decimal? Quantity,
    decimal? UnitPrice);
