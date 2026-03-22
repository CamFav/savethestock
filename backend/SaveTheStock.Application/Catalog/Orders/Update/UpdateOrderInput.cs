namespace SaveTheStock.Application.Catalog.Orders.Update;

public sealed record UpdateOrderInput(
    Guid OrderId,
    DateOnly OrderDate,
    Guid? SupplierId,
    string? Notes);
