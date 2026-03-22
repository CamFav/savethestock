using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using SaveTheStock.Api.Options;

namespace SaveTheStock.Api.Security;

public sealed class AuthCookieService
{
    private readonly IOptionsMonitor<SecurityHardeningOptions> _optionsMonitor;

    public AuthCookieService(IOptionsMonitor<SecurityHardeningOptions> optionsMonitor)
    {
        _optionsMonitor = optionsMonitor;
    }

    public bool IsEnabled => _optionsMonitor.CurrentValue.AuthCookie.Enabled;

    public string CookieName => _optionsMonitor.CurrentValue.AuthCookie.CookieName;

    public string CsrfCookieName => _optionsMonitor.CurrentValue.AuthCookie.CsrfCookieName;

    public string CsrfHeaderName => _optionsMonitor.CurrentValue.AuthCookie.CsrfHeaderName;

    public void AppendAuthCookies(HttpContext httpContext, string accessToken, DateTimeOffset expiresAt)
    {
        if (!IsEnabled)
        {
            return;
        }

        httpContext.Response.Cookies.Append(
            CookieName,
            accessToken,
            CreateCookieOptions(httpContext, expiresAt, httpOnly: true));

        httpContext.Response.Cookies.Append(
            CsrfCookieName,
            GenerateToken(),
            CreateCookieOptions(httpContext, expiresAt, httpOnly: false));
    }

    public void ClearAuthCookies(HttpContext httpContext)
    {
        if (!IsEnabled)
        {
            return;
        }

        httpContext.Response.Cookies.Delete(CookieName, CreateDeleteCookieOptions(httpContext));
        httpContext.Response.Cookies.Delete(CsrfCookieName, CreateDeleteCookieOptions(httpContext));
    }

    private CookieOptions CreateCookieOptions(HttpContext httpContext, DateTimeOffset expiresAt, bool httpOnly)
    {
        var cookieOptions = _optionsMonitor.CurrentValue.AuthCookie;

        return new CookieOptions
        {
            HttpOnly = httpOnly,
            Secure = cookieOptions.RequireSecure || httpContext.Request.IsHttps,
            SameSite = ParseSameSite(cookieOptions.SameSite),
            Expires = expiresAt,
            IsEssential = true,
            Path = "/"
        };
    }

    private CookieOptions CreateDeleteCookieOptions(HttpContext httpContext)
    {
        var cookieOptions = _optionsMonitor.CurrentValue.AuthCookie;

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = cookieOptions.RequireSecure || httpContext.Request.IsHttps,
            SameSite = ParseSameSite(cookieOptions.SameSite),
            Path = "/"
        };
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static SameSiteMode ParseSameSite(string? sameSite)
        => sameSite?.Trim().ToUpperInvariant() switch
        {
            "NONE" => SameSiteMode.None,
            "STRICT" => SameSiteMode.Strict,
            _ => SameSiteMode.Lax,
        };
}
