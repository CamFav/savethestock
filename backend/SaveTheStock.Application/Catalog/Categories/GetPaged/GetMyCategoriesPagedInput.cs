namespace SaveTheStock.Application.Catalog.Categories.GetMyListPaged;

public sealed record GetMyCategoriesPagedInput(int Page = 1, int PageSize = 10);