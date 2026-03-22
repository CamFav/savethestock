namespace SaveTheStock.Application.Catalog.Orders.AddLine;

public sealed record AddOrderLineInput(
    Guid OrderId,
    Guid ProductId,
    decimal? Quantity,
    decimal? UnitPrice);
