namespace SaveTheStock.Api.Contracts.WasteSessions;

public sealed record UpdateWasteLineRequest(
    decimal Quantity,
    string Reason);
