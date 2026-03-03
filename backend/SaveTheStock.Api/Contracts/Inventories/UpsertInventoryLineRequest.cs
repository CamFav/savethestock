namespace SaveTheStock.Api.Contracts.Inventories;

public sealed record UpsertInventoryLineRequest(
    Guid ProductId,
    decimal RealQuantity);
