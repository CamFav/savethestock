namespace SaveTheStock.Application.Catalog.WasteSessions.Create;

public sealed record CreateWasteSessionResult(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly WasteDate,
    string Status,
    string? Comment,
    DateTime CreatedAt);
