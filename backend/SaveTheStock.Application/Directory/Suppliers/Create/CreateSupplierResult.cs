namespace SaveTheStock.Application.Directory.Suppliers.Create;

public sealed record CreateSupplierResult(Guid Id, string Name, string? Email, string? Phone);
