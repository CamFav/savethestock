namespace SaveTheStock.Application.Catalog.Dashboard;

public sealed record WasteTrendPointData(
    DateOnly Date,
    decimal WasteValue,
    decimal WasteQty);

public sealed record TopWasteProductData(
    Guid ProductId,
    string ProductName,
    decimal TotalWasteQty,
    decimal TotalWasteValue);

public sealed record LowStockProductAlertData(
    Guid ProductId,
    string ProductName,
    int AlertThreshold,
    decimal QuantityRemaining);

public sealed record LotAlertData(
    Guid LotId,
    Guid ProductId,
    string ProductName,
    string? LotCode,
    DateOnly ExpiryDate,
    decimal QuantityRemaining);

