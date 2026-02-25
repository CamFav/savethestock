namespace SaveTheStock.Api.Contracts.Auth;

/// <summary>
/// Represents the response payload for the login endpoint, containing the generated access token, 
/// its expiration time, and a flag indicating whether the user must change their password on next login.
/// </summary>
public sealed record LoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    bool MustChangePassword
);