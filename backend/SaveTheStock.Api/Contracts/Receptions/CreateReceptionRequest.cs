namespace SaveTheStock.Api.Contracts.Receptions;

public sealed record CreateReceptionRequest(
    DateOnly ReceptionDate,
    string? Reference,
    bool HasIssue,
    string? IssueNote,
    Guid? SupplierId);