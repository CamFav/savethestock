namespace SaveTheStock.Api.Contracts.Dashboard;

public sealed record DashboardSummaryResponse(
    decimal StockUsableValue,
    decimal StockExpiredValue,
    decimal StockTotalValue,
    decimal WasteValue,
    decimal WasteQty,
    decimal? ReceptionsValue,
    decimal? WasteRate,
    decimal InventoryVarianceValue);
