namespace SaveTheStock.Api.Contracts.Dashboard;

public sealed record WasteTrendPointResponse(
    DateOnly Date,
    decimal WasteValue,
    decimal WasteQty);

