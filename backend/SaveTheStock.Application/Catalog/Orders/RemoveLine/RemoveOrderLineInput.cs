namespace SaveTheStock.Application.Catalog.Orders.RemoveLine;

public sealed record RemoveOrderLineInput(
    Guid OrderId,
    Guid OrderLineId);
