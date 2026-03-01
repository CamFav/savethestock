namespace SaveTheStock.Application.Catalog.Products.Create;

public sealed record CreateProductResult(
    Guid Id,
    Guid CompanyId,
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive,
    DateTime CreatedAt);