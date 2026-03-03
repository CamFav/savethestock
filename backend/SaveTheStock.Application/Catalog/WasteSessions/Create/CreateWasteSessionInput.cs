namespace SaveTheStock.Application.Catalog.WasteSessions.Create;

public sealed record CreateWasteSessionInput(
    DateOnly WasteDate,
    string? Comment);
