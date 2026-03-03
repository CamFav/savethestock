namespace SaveTheStock.Api.Contracts.Inventories;

public sealed record CreateInventoryRequest(
    DateOnly InventoryDate,
    string? Comment);
