namespace SaveTheStock.Application.Catalog.Operational;

public sealed record OperationalLotItemData(
    Guid LotId,
    string? LotCode,
    Guid ProductId,
    string ProductName,
    DateOnly ExpiryDate,
    decimal RemainingQty,
    decimal UnitCost,
    decimal RemainingValue);

public sealed record OperationalLowStockProductData(
    Guid ProductId,
    string ProductName,
    decimal CurrentQty,
    int AlertThreshold);
