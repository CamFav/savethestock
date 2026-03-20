namespace SaveTheStock.Api.Contracts.Categories;

public sealed record PagedCategoryResponse(
    IReadOnlyList<CategoryResponse> Items,
    int Total,
    int Page,
    int PageSize);