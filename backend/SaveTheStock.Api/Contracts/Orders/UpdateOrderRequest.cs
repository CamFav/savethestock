namespace SaveTheStock.Api.Contracts.Orders;

public sealed record UpdateOrderRequest(
    DateOnly OrderDate,
    Guid? SupplierId,
    string? Notes);
