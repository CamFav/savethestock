namespace SaveTheStock.Api.Contracts.Inventories;

public sealed record InventoryResponse(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly InventoryDate,
    string Status,
    string? Comment,
    DateTime CreatedAt,
    string? PostedByName,
    IReadOnlyList<InventoryLineResponse> Lines);
