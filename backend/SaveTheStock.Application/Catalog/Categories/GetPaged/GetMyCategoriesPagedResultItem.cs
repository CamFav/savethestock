namespace SaveTheStock.Application.Catalog.Categories.GetMyListPaged;

public sealed record GetMyCategoriesPagedResultItem(
    Guid Id,
    Guid CompanyId,
    string Name,
    DateTime CreatedAt);