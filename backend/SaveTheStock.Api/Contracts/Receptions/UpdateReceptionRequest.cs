namespace SaveTheStock.Api.Contracts.Receptions;

public sealed record UpdateReceptionRequest(
    DateOnly ReceptionDate,
    string? Reference,
    bool HasIssue,
    string? IssueNote,
    Guid? SupplierId);