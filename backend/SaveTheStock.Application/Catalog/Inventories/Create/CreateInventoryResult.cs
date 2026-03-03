namespace SaveTheStock.Application.Catalog.Inventories.Create;

public sealed record CreateInventoryResult(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly InventoryDate,
    string Status,
    string? Comment,
    DateTime CreatedAt);
