namespace SaveTheStock.Application.Catalog.Products.Create;

public sealed record CreateProductInput(
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive);