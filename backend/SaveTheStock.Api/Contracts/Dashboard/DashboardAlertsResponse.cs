namespace SaveTheStock.Api.Contracts.Dashboard;

public sealed record DashboardAlertsResponse(
    IReadOnlyList<LowStockProductAlertResponse> LowStockProducts,
    IReadOnlyList<LotAlertResponse> ExpiringLots,
    IReadOnlyList<LotAlertResponse> ExpiredLots,
    decimal ExpiredStockValue);

public sealed record LowStockProductAlertResponse(
    Guid ProductId,
    string ProductName,
    int AlertThreshold,
    decimal QuantityRemaining);

public sealed record LotAlertResponse(
    Guid LotId,
    Guid ProductId,
    string ProductName,
    string? LotCode,
    DateOnly ExpiryDate,
    decimal QuantityRemaining);
