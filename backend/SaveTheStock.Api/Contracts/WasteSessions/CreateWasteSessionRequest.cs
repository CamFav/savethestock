namespace SaveTheStock.Api.Contracts.WasteSessions;

public sealed record CreateWasteSessionRequest(
    DateOnly WasteDate,
    string? Comment);
