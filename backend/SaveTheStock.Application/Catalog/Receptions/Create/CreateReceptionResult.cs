namespace SaveTheStock.Application.Catalog.Receptions.Create;

public sealed record CreateReceptionResult(
    Guid Id,
    Guid CompanyId,
    DateOnly ReceptionDate,
    string? Reference,
    bool HasIssue,
    string? IssueNote,
    string Status,
    Guid AccountId,
    Guid? SupplierId,
    Guid? OrderId,
    DateTime CreatedAt);
