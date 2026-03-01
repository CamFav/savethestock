namespace SaveTheStock.Application.Catalog.Lots.Create;

public sealed record CreateLotInput(
    Guid ProductId,
    Guid? ReceptionId,
    string? LotCode,
    DateOnly? ExpiryDate,
    decimal UnitCost,
    decimal QuantityInitial);