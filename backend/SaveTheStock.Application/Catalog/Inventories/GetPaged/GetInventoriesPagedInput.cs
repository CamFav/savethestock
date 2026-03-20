namespace SaveTheStock.Application.Catalog.Inventories.GetPaged;

public sealed record GetInventoriesPagedInput(
    int Page = 1,
    int PageSize = 20,
    DateOnly? From = null,
    DateOnly? To = null,
    string? Status = null);
