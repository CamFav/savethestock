namespace SaveTheStock.Api.Contracts.Products;

/// <summary>
/// Response model for a paged list of products.
/// </summary>
public sealed record PagedProductsResponse(
    IReadOnlyList<ProductResponse> Items,
    int Total,
    int Page,
    int PageSize);