namespace SaveTheStock.Api.Contracts.Orders;

public sealed record OrderLineResponse(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string Unit,
    decimal QuantityOrdered,
    decimal QuantityReceived,
    decimal? UnitPrice);
