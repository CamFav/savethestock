namespace SaveTheStock.Application.Catalog.Orders.AddToDraft;

public sealed record AddProductToDraftOrderInput(
    Guid ProductId,
    decimal? Quantity,
    decimal? UnitPrice);
