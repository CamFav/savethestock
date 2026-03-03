namespace SaveTheStock.Application.Catalog.WasteSessions.GetPaged;

public sealed record WasteSessionItem(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly WasteDate,
    string Status,
    string? Comment,
    DateTime CreatedAt);

public sealed record GetWasteSessionsPagedResult(
    IReadOnlyList<WasteSessionItem> Items,
    int Page,
    int PageSize,
    int Total);
