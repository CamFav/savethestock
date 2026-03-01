namespace SaveTheStock.Api.Contracts.Products;

/// <summary>
/// Request model for updating an existing product.
/// </summary>
public sealed record UpdateProductRequest(
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive);