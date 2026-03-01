namespace SaveTheStock.Application.Catalog.Products.Update;

public sealed record UpdateProductInput(
    Guid ProductId,
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive);