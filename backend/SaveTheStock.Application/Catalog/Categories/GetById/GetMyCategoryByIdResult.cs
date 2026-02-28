namespace SaveTheStock.Application.Catalog.Categories.GetMyById;

public sealed record GetMyCategoryByIdResult(
    Guid Id,
    Guid CompanyId,
    string Name,
    DateTime CreatedAt);