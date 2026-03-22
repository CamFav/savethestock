namespace SaveTheStock.Application.Catalog.Orders.Common;

public sealed record OrderLineView(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string Unit,
    decimal QuantityOrdered,
    decimal QuantityReceived,
    decimal? UnitPrice);
