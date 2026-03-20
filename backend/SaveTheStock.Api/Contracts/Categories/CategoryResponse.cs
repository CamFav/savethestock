namespace SaveTheStock.Api.Contracts.Categories;

/// <summary>
/// Response model for category data returned by the API.
/// </summary>
public sealed record CategoryResponse(
    Guid Id,
    Guid CompanyId,
    string Name,
    DateTime CreatedAt);