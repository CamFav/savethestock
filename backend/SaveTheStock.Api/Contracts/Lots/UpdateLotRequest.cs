namespace SaveTheStock.Api.Contracts.Lots;

public sealed record UpdateLotRequest(
    Guid? ReceptionId,
    string? LotCode,
    DateOnly? ExpiryDate,
    decimal UnitCost,
    bool HasIssue,
    string? IssueNote);