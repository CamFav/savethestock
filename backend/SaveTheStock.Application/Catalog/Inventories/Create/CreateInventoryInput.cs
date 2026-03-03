namespace SaveTheStock.Application.Catalog.Inventories.Create;

public sealed record CreateInventoryInput(
    DateOnly InventoryDate,
    string? Comment);
