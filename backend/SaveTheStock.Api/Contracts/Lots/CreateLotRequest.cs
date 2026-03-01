namespace SaveTheStock.Api.Contracts.Lots;

public sealed record CreateLotRequest(
    Guid ProductId,
    Guid? ReceptionId,
    string? LotCode,
    DateOnly? ExpiryDate,
    decimal UnitCost,
    decimal QuantityInitial);