namespace SaveTheStock.Api.Contracts.WasteSessions;

public sealed record WasteLineResponse(
    Guid Id,
    Guid CompanyId,
    Guid WasteSessionId,
    Guid LotId,
    decimal Quantity,
    string Reason);
