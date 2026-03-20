namespace SaveTheStock.Application.Catalog.Products.Update;

public sealed record UpdateProductResult(
    Guid Id,
    Guid CompanyId,
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive,
    DateTime CreatedAt);