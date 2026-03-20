namespace SaveTheStock.Application.Catalog.WasteSessions.GetPaged;

public sealed record GetWasteSessionsPagedInput(
    int Page = 1,
    int PageSize = 20,
    DateOnly? From = null,
    DateOnly? To = null,
    string? Status = null);
