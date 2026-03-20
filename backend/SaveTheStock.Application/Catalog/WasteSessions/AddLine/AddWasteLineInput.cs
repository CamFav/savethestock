namespace SaveTheStock.Application.Catalog.WasteSessions.AddLine;

public sealed record AddWasteLineInput(
    Guid WasteSessionId,
    Guid LotId,
    decimal Quantity,
    string Reason);
