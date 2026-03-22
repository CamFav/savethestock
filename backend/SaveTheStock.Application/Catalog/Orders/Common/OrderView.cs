namespace SaveTheStock.Application.Catalog.Orders.Common;

public sealed record OrderView(
    Guid Id,
    string Reference,
    DateOnly OrderDate,
    Guid? SupplierId,
    string Status,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<Guid> ReceptionIds,
    IReadOnlyList<OrderLineView> Lines);
