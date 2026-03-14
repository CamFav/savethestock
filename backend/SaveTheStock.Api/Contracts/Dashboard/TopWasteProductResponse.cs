namespace SaveTheStock.Api.Contracts.Dashboard;

public sealed record TopWasteProductResponse(
    Guid ProductId,
    string ProductName,
    decimal TotalWasteQty,
    decimal TotalWasteValue);

