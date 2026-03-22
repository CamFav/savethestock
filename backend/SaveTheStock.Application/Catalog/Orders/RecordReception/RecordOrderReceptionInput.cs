namespace SaveTheStock.Application.Catalog.Orders.RecordReception;

public sealed record OrderReceptionQuantityInput(Guid ProductId, decimal QuantityReceived);

public sealed record RecordOrderReceptionInput(
    Guid OrderId,
    Guid ReceptionId,
    IReadOnlyList<OrderReceptionQuantityInput> Lines);
