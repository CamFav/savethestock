namespace SaveTheStock.Application.Catalog.Inventories.RemoveLine;

public sealed record RemoveInventoryLineInput(
    Guid InventoryId,
    Guid LineId);
