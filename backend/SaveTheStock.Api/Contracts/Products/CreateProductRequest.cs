namespace SaveTheStock.Api.Contracts.Products;

public sealed record CreateProductRequest(
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive);