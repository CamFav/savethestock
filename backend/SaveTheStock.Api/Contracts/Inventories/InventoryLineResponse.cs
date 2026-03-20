namespace SaveTheStock.Api.Contracts.Inventories;

public sealed record InventoryLineResponse(
    Guid Id,
    Guid CompanyId,
    Guid InventoryId,
    Guid ProductId,
    decimal TheoreticalQuantity,
    decimal RealQuantity);
