namespace SaveTheStock.Application.Catalog.Products.GetPaged;

public sealed record GetProductsPagedItem(
    Guid Id,
    Guid CompanyId,
    Guid CategoryId,
    string Name,
    string Unit,
    int AlertThreshold,
    bool IsActive,
    DateTime CreatedAt);