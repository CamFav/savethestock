namespace SaveTheStock.Application.Catalog.WasteSessions.UpdateLine;

public sealed record UpdateWasteLineInput(
    Guid WasteSessionId,
    Guid WasteLineId,
    decimal Quantity,
    string Reason);
