namespace SaveTheStock.Api.Contracts.WasteSessions;

public sealed record AddWasteLineRequest(
    Guid LotId,
    decimal Quantity,
    string Reason);
