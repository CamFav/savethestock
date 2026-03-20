namespace SaveTheStock.Api.Contracts.Suppliers;

public sealed record PagedSuppliersResponse(
    IReadOnlyList<SupplierResponse> Items,
    int Page,
    int PageSize,
    int Total);
