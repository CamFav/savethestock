namespace SaveTheStock.Api.Contracts.Suppliers;

public sealed record CreateSupplierRequest(string Name, string? Email = null, string? Phone = null);
