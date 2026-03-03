namespace SaveTheStock.Application.Catalog.WasteSessions.RemoveLine;

public sealed record RemoveWasteLineInput(
    Guid WasteSessionId,
    Guid WasteLineId);
