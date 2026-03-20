namespace SaveTheStock.Api.Contracts.Categories;

/// <summary>
/// Request model for creating a new category.
/// </summary>
public sealed record CreateCategoryRequest(string Name);