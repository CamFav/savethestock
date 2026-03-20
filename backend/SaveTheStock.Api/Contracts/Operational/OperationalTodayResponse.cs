namespace SaveTheStock.Api.Contracts.Operational;

public sealed record OperationalTodayResponse(
    IReadOnlyList<OperationalLotItemResponse> ExpiringLots,
    IReadOnlyList<OperationalLotItemResponse> ExpiredLots,
    IReadOnlyList<OperationalLowStockProductResponse> LowStockProducts,
    OperationalQuickStatsResponse QuickStats);

public sealed record OperationalLotItemResponse(
    Guid LotId,
    string? LotCode,
    Guid ProductId,
    string ProductName,
    DateOnly ExpiryDate,
    decimal RemainingQty,
    decimal UnitCost,
    decimal RemainingValue);

public sealed record OperationalLowStockProductResponse(
    Guid ProductId,
    string ProductName,
    decimal CurrentQty,
    int AlertThreshold);

public sealed record OperationalQuickStatsResponse(
    int ExpiringCount,
    int ExpiredCount,
    int LowStockCount);
