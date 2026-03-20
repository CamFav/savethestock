namespace SaveTheStock.Application.Catalog.Receptions.Create;

public sealed record CreateReceptionInput(
    DateOnly ReceptionDate,
    string? Reference,
    bool HasIssue,
    string? IssueNote,
    Guid? SupplierId);