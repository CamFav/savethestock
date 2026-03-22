namespace SaveTheStock.Api.Contracts.Suppliers;

public sealed record SupplierResponse(Guid Id, string Name, string? Email, string? Phone);
