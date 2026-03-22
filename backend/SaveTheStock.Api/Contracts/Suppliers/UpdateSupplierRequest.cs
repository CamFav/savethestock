namespace SaveTheStock.Api.Contracts.Suppliers;

public sealed record UpdateSupplierRequest(string Name, string? Email = null, string? Phone = null);
