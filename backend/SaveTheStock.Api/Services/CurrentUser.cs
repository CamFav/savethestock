using System.Security.Claims;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Services;

public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _http;

    public CurrentUser(IHttpContextAccessor http)
    {
        _http = http;
    }

    private ClaimsPrincipal? User => _http.HttpContext?.User;

    public bool IsAuthenticated =>
        User?.Identity?.IsAuthenticated == true;

    public Guid? AccountId => TryParseGuid(CustomClaimTypes.AccountId);

    public Guid? CompanyId => TryParseGuid(CustomClaimTypes.CompanyId);

    public string? Role =>
        User?.FindFirst(ClaimTypes.Role)?.Value;

    private Guid? TryParseGuid(string claimType)
    {
        var value = User?.FindFirst(claimType)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }
}