namespace SaveTheStock.Api.Contracts.WasteSessions;

public sealed record WasteSessionResponse(
    Guid Id,
    Guid CompanyId,
    Guid AccountId,
    DateOnly WasteDate,
    string Status,
    string? Comment,
    DateTime CreatedAt,
    string? PostedByName,
    IReadOnlyList<WasteLineResponse> Lines);
