namespace SaveTheStock.Application.Common.Models;

/// <summary>
/// Represents a paginated result set.
/// </summary>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize);