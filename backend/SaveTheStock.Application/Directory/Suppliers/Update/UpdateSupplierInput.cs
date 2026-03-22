namespace SaveTheStock.Application.Directory.Suppliers.Update;

public sealed record UpdateSupplierInput(Guid SupplierId, string Name, string? Email, string? Phone);
