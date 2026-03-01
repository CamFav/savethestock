namespace SaveTheStock.Api.Contracts.Lots;

public sealed record LotResponse(
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