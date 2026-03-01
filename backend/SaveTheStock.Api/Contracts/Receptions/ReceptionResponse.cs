namespace SaveTheStock.Api.Contracts.Receptions;

public sealed record ReceptionResponse(
    Guid Id,
    Guid CompanyId,
    DateOnly ReceptionDate,
    string? Reference,
    bool HasIssue,
    string? IssueNote,
    string Status,
    Guid AccountId,
    Guid? SupplierId,
    DateTime CreatedAt);