namespace SaveTheStock.Api.Contracts.Products;

/// <summary>
/// Response model for product data returned by the API.
/// </summary>
public sealed record ProductResponse(
    Guid Id,
    Guid CompanyId,
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive,
    DateTime CreatedAt);