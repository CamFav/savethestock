namespace SaveTheStock.Application.Catalog.WasteSessions.GetById;

public sealed record WasteLineResult(
    Guid Id,
    Guid CompanyId,
    Guid WasteSessionId,
    Guid LotId,
    decimal Quantity,
    string Reason);

public sealed record GetWasteSessionByIdResult(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly WasteDate,
    string Status,
    string? Comment,
    DateTime CreatedAt,
    string? PostedByName,
    IReadOnlyList<WasteLineResult> Lines);
