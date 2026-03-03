namespace SaveTheStock.Application.Catalog.Inventories.GetById;

public sealed record InventoryLineResult(
    Guid Id,
    Guid CompanyId,
    Guid InventoryId,
    Guid ProductId,
    decimal TheoreticalQuantity,
    decimal RealQuantity);

public sealed record GetInventoryByIdResult(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly InventoryDate,
    string Status,
    string? Comment,
    DateTime CreatedAt,
    IReadOnlyList<InventoryLineResult> Lines);
