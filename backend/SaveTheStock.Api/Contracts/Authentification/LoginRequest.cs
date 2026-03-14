namespace SaveTheStock.Api.Contracts.Auth;

/// <summary>
/// Represents the request payload for the login endpoint,
/// containing the user's email and password for authentication.
/// </summary>
public sealed record LoginRequest(
    string Email,
    string Password
);
