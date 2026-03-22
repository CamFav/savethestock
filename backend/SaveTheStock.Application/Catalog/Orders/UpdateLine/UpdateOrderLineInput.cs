namespace SaveTheStock.Application.Catalog.Orders.UpdateLine;

public sealed record UpdateOrderLineInput(
    Guid OrderId,
    Guid OrderLineId,
    decimal QuantityOrdered,
    decimal? UnitPrice);
