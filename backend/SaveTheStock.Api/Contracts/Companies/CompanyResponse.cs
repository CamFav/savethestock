namespace SaveTheStock.Api.Contracts.Companies;

/// <summary>
/// Response payload representing a company.
/// This DTO defines the public API contract (what the client is allowed to see),
/// and avoids exposing EF Core entities directly.
/// </summary>
public sealed class CompanyResponse
{
    /// <summary>
    /// Unique identifier of the company.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Display name of the company.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// UTC creation date of the company.
    /// </summary>
    public DateTime CreatedAt { get; init; }
}