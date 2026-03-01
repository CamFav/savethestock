namespace SaveTheStock.Application.Catalog.Lots.GetPaged;

public sealed record GetLotsPagedInput(
    int Page,
    int PageSize,
    Guid? ProductId,
    Guid? ReceptionId);
    