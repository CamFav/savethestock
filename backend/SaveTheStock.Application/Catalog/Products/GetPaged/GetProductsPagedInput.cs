namespace SaveTheStock.Application.Catalog.Products.GetPaged;

public sealed record GetProductsPagedInput(
    int Page,
    int PageSize,
    Guid? CategoryId);