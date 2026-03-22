namespace SaveTheStock.Api.Contracts.Orders;

public sealed record OrderResponse(
    Guid Id,
    string Reference,
    DateOnly OrderDate,
    Guid? SupplierId,
    string Status,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<Guid> ReceptionIds,
    IReadOnlyList<OrderLineResponse> Lines);
