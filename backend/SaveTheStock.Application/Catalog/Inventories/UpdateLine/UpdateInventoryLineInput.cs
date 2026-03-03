namespace SaveTheStock.Application.Catalog.Inventories.UpdateLine;

public sealed record UpdateInventoryLineInput(
    Guid InventoryId,
    Guid LineId,
    decimal RealQuantity);
