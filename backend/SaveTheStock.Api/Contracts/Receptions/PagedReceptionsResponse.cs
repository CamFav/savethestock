namespace SaveTheStock.Api.Contracts.Receptions;

public sealed record PagedReceptionsResponse(
    IReadOnlyList<ReceptionResponse> Items,
    int Page,
    int PageSize,
    int Total);