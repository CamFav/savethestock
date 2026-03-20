namespace SaveTheStock.Api.Contracts.Inventories;

public sealed record PagedInventoriesResponse(
    IReadOnlyList<InventoryResponse> Items,
    int Page,
    int PageSize,
    int Total);
