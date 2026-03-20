namespace SaveTheStock.Application.Directory.Suppliers.GetPaged;

public sealed record GetSuppliersPagedInput(int Page = 1, int PageSize = 20);
