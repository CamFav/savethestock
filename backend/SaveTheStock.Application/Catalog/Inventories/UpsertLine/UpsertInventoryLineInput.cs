namespace SaveTheStock.Application.Catalog.Inventories.UpsertLine;

public sealed record UpsertInventoryLineInput(
    Guid InventoryId,
    Guid ProductId,
    decimal RealQuantity);
