namespace SaveTheStock.Api.Contracts.Auth;

/// <summary>
/// Represents the response payload for the login endpoint.
/// </summary>
public sealed record LoginResponse(
    string JwtToken,
    Guid AccountId,
    Guid CompanyId,
    string Role,
    string DisplayName
);
