namespace SaveTheStock.Application.Catalog.Inventories.UpsertLine;

public sealed record UpsertInventoryLineResult(
    Guid Id,
    Guid CompanyId,
    Guid InventoryId,
    Guid ProductId,
    decimal TheoreticalQuantity,
    decimal RealQuantity);
