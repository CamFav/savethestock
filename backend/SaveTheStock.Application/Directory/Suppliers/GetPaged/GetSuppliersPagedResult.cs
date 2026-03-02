namespace SaveTheStock.Application.Directory.Suppliers.GetPaged;

public sealed record GetSuppliersPagedResult(
    IReadOnlyList<GetSuppliersPagedItem> Items,
    int Page,
    int PageSize,
    int Total);
