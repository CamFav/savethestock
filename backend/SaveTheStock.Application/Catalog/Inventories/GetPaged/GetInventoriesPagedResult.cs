namespace SaveTheStock.Application.Catalog.Inventories.GetPaged;

public sealed record InventoryItem(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly InventoryDate,
    string Status,
    string? Comment,
    DateTime CreatedAt,
    string? PostedByName);

public sealed record GetInventoriesPagedResult(
    IReadOnlyList<InventoryItem> Items,
    int Page,
    int PageSize,
    int Total);
