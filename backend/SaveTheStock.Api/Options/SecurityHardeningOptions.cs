namespace SaveTheStock.Api.Options;

public sealed class SecurityHardeningOptions
{
    public LoginProtectionOptions LoginProtection { get; init; } = new();
    public AuthCookieOptions AuthCookie { get; init; } = new();
}

public sealed class LoginProtectionOptions
{
    public int MaxFailedAttemptsPerIdentifier { get; init; } = 5;
    public int LockoutMinutes { get; init; } = 15;
    public int MaxFailedAttemptsPerIpWindow { get; init; } = 20;
    public int IpWindowMinutes { get; init; } = 10;
}

public sealed class AuthCookieOptions
{
    public bool Enabled { get; init; } = false;
    public string CookieName { get; init; } = "savethestock_access";
    public string CsrfCookieName { get; init; } = "XSRF-TOKEN";
    public string CsrfHeaderName { get; init; } = "X-CSRF-TOKEN";
    public bool RequireSecure { get; init; } = false;
    public string SameSite { get; init; } = "Lax";
}
