namespace SaveTheStock.Api.Contracts.Auth;

public sealed record LoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    bool MustChangePassword
);