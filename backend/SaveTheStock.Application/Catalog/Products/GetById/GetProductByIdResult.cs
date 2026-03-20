namespace SaveTheStock.Application.Catalog.Products.GetById;

public sealed record GetProductByIdResult(
    Guid Id,
    Guid CompanyId,
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive,
    DateTime CreatedAt);