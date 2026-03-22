namespace SaveTheStock.Application.Catalog.Receptions.GetPaged;

public sealed record ReceptionItem(
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

public sealed record GetReceptionsPagedResult(
    IReadOnlyList<ReceptionItem> Items,
    int Page,
    int PageSize,
    int Total);
