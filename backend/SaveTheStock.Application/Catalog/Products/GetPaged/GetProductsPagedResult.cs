namespace SaveTheStock.Application.Catalog.Products.GetPaged;

public sealed record GetProductsPagedResult(
    IReadOnlyList<GetProductsPagedItem> Items,
    int Total,
    int Page,
    int PageSize);