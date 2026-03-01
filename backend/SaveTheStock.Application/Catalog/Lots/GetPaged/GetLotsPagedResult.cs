namespace SaveTheStock.Application.Catalog.Lots.GetPaged;

public sealed record LotItem(
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

public sealed record GetLotsPagedResult(
    IReadOnlyList<LotItem> Items,
    int Page,
    int PageSize,
    int Total);