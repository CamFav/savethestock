namespace SaveTheStock.Application.Catalog.Lots.Update;

public sealed record UpdateLotInput(
    Guid LotId,
    Guid? ReceptionId,
    string? LotCode,
    DateOnly? ExpiryDate,
    decimal UnitCost,
    bool HasIssue,
    string? IssueNote);