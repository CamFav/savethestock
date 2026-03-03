namespace SaveTheStock.Api.Contracts.WasteSessions;

public sealed record PagedWasteSessionsResponse(
    IReadOnlyList<WasteSessionResponse> Items,
    int Page,
    int PageSize,
    int Total);
