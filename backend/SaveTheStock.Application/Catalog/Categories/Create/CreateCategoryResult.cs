namespace SaveTheStock.Application.Catalog.Categories.Create;

/// <summary>
/// Output model for the result of creating a new category.
/// </summary>
public sealed record CreateCategoryResult(
    Guid Id,
    Guid CompanyId,
    string Name,
    DateTime CreatedAt);