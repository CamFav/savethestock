namespace SaveTheStock.Application.Options;

/// <summary>
/// Represents the configuration options for JWT (JSON Web Token) authentication in the application.
/// </summary>
public sealed class JwtOptions
{
    public string Issuer { get; init; } = default!;
    public string Audience { get; init; } = default!;
    public string Secret { get; init; } = default!;
    public int ExpiresMinutes { get; init; } = 60;
}