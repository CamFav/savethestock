namespace SaveTheStock.Api.Contracts.Orders;

public sealed record RecordOrderReceptionLineRequest(
    Guid ProductId,
    decimal QuantityReceived);

public sealed record RecordOrderReceptionRequest(
    Guid ReceptionId,
    IReadOnlyList<RecordOrderReceptionLineRequest>? Lines);
