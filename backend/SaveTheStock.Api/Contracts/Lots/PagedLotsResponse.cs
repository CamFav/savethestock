namespace SaveTheStock.Api.Contracts.Lots;

public sealed record PagedLotsResponse(
    IReadOnlyList<LotResponse> Items,
    int Page,
    int PageSize,
    int Total);