namespace SaveTheStock.Application.Catalog.Lots.Create;

public sealed record CreateLotResult(
    Guid Id,
    Guid CompanyId,
    Guid ProductId,
    Guid? ReceptionId,
    string? LotCode,
    DateOnly? ExpiryDate,
    decimal UnitCost,
    decimal QuantityInitial,
    decimal QuantityRemaining,
    bool HasIssue,
    string? IssueNote,
    DateTime CreatedAt);