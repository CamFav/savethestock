namespace SaveTheStock.Application.Catalog.Receptions.Update;

public sealed record UpdateReceptionInput(
    Guid ReceptionId,
    DateOnly ReceptionDate,
    string? Reference,
    bool HasIssue,
    string? IssueNote,
    Guid? SupplierId);