namespace SaveTheStock.Application.Catalog.WasteSessions.AddLine;

public sealed record AddWasteLineResult(
    Guid Id,
    Guid CompanyId,
    Guid WasteSessionId,
    Guid LotId,
    decimal Quantity,
    string Reason);
