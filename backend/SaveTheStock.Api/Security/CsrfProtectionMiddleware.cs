using Microsoft.AspNetCore.Mvc;

namespace SaveTheStock.Api.Security;

public sealed class CsrfProtectionMiddleware
{
    private static readonly HashSet<string> UnsafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete,
    };

    private readonly RequestDelegate _next;

    public CsrfProtectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AuthCookieService authCookieService, ILogger<CsrfProtectionMiddleware> logger)
    {
        if (!authCookieService.IsEnabled ||
            !UnsafeMethods.Contains(context.Request.Method) ||
            context.Request.Headers.ContainsKey("Authorization"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Cookies.TryGetValue(authCookieService.CookieName, out var authCookieValue) ||
            string.IsNullOrWhiteSpace(authCookieValue))
        {
            await _next(context);
            return;
        }

        var csrfCookie = context.Request.Cookies[authCookieService.CsrfCookieName];
        var csrfHeader = context.Request.Headers[authCookieService.CsrfHeaderName].ToString();

        if (string.IsNullOrWhiteSpace(csrfCookie) ||
            string.IsNullOrWhiteSpace(csrfHeader) ||
            !string.Equals(csrfCookie, csrfHeader, StringComparison.Ordinal))
        {
            logger.LogWarning(
                "Security audit: CSRF validation failed for {Method} {Path} from IP {ClientIp}.",
                context.Request.Method,
                context.Request.Path,
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown");

            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid CSRF token.",
            });
            return;
        }

        await _next(context);
    }
}
