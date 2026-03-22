using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using SaveTheStock.Api.Options;

namespace SaveTheStock.Api.Security;

public sealed class LoginProtectionService
{
    private static readonly TimeSpan CacheEntryBuffer = TimeSpan.FromHours(1);

    private readonly IMemoryCache _cache;
    private readonly IOptionsMonitor<SecurityHardeningOptions> _optionsMonitor;
    private readonly ILogger<LoginProtectionService> _logger;

    public LoginProtectionService(
        IMemoryCache cache,
        IOptionsMonitor<SecurityHardeningOptions> optionsMonitor,
        ILogger<LoginProtectionService> logger)
    {
        _cache = cache;
        _optionsMonitor = optionsMonitor;
        _logger = logger;
    }

    public LoginAttemptDecision Evaluate(string? normalizedEmail, string clientIp)
    {
        var now = DateTimeOffset.UtcNow;
        var options = _optionsMonitor.CurrentValue.LoginProtection;

        if (TryGetIpState(clientIp) is { } ipState)
        {
            var ipWindow = TimeSpan.FromMinutes(Math.Max(options.IpWindowMinutes, 1));
            if (now - ipState.WindowStartedUtc > ipWindow)
            {
                _cache.Remove(GetIpKey(clientIp));
            }
            else if (ipState.FailureCount >= Math.Max(options.MaxFailedAttemptsPerIpWindow, 1))
            {
                _logger.LogWarning(
                    "Security lockout: login throttled for IP {ClientIp}.",
                    clientIp);

                return LoginAttemptDecision.Blocked("Trop de tentatives de connexion. Réessayez plus tard.");
            }
        }

        if (!string.IsNullOrWhiteSpace(normalizedEmail) &&
            TryGetIdentifierState(normalizedEmail) is { LockedUntilUtc: { } lockedUntil } identifierState &&
            lockedUntil > now)
        {
            _logger.LogWarning(
                "Security lockout: account login temporarily locked for identifier {Identifier} from IP {ClientIp} until {LockedUntilUtc}.",
                MaskEmail(normalizedEmail),
                clientIp,
                lockedUntil);

            return LoginAttemptDecision.Blocked("Trop de tentatives de connexion. Réessayez plus tard.");
        }

        return LoginAttemptDecision.Allowed();
    }

    public void RecordFailure(string? normalizedEmail, string clientIp)
    {
        var now = DateTimeOffset.UtcNow;
        var options = _optionsMonitor.CurrentValue.LoginProtection;

        var ipKey = GetIpKey(clientIp);
        var ipWindow = TimeSpan.FromMinutes(Math.Max(options.IpWindowMinutes, 1));
        var ipState = _cache.GetOrCreate(ipKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ipWindow + CacheEntryBuffer;
            return new IpFailureState(now, 0);
        })!;

        if (now - ipState.WindowStartedUtc > ipWindow)
        {
            ipState.WindowStartedUtc = now;
            ipState.FailureCount = 0;
        }
        ipState.FailureCount += 1;
        _cache.Set(ipKey, ipState, ipWindow + CacheEntryBuffer);

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            _logger.LogWarning(
                "Security audit: failed login attempt from IP {ClientIp} without a valid normalized identifier.",
                clientIp);
            return;
        }

        var identifierKey = GetIdentifierKey(normalizedEmail);
        var identifierState = _cache.GetOrCreate(identifierKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(Math.Max(options.LockoutMinutes, 1)) + CacheEntryBuffer;
            return new IdentifierFailureState(0, null);
        })!;

        identifierState.FailureCount += 1;

        var maxFailedAttempts = Math.Max(options.MaxFailedAttemptsPerIdentifier, 1);
        if (identifierState.FailureCount >= maxFailedAttempts)
        {
            identifierState.LockedUntilUtc = now.AddMinutes(Math.Max(options.LockoutMinutes, 1));
            _logger.LogWarning(
                "Security lockout: login temporarily locked for identifier {Identifier} from IP {ClientIp} until {LockedUntilUtc}.",
                MaskEmail(normalizedEmail),
                clientIp,
                identifierState.LockedUntilUtc);
        }
        else
        {
            _logger.LogWarning(
                "Security audit: failed login attempt for identifier {Identifier} from IP {ClientIp}. FailureCount={FailureCount}.",
                MaskEmail(normalizedEmail),
                clientIp,
                identifierState.FailureCount);
        }

        _cache.Set(
            identifierKey,
            identifierState,
            TimeSpan.FromMinutes(Math.Max(options.LockoutMinutes, 1)) + CacheEntryBuffer);
    }

    public void RecordSuccess(string? normalizedEmail, string clientIp)
    {
        _cache.Remove(GetIpKey(clientIp));

        if (!string.IsNullOrWhiteSpace(normalizedEmail))
        {
            _cache.Remove(GetIdentifierKey(normalizedEmail));
        }
    }

    private IpFailureState? TryGetIpState(string clientIp)
        => _cache.Get<IpFailureState>(GetIpKey(clientIp));

    private IdentifierFailureState? TryGetIdentifierState(string normalizedEmail)
        => _cache.Get<IdentifierFailureState>(GetIdentifierKey(normalizedEmail));

    private static string GetIpKey(string clientIp) => $"login-protection:ip:{clientIp}";

    private static string GetIdentifierKey(string normalizedEmail) => $"login-protection:identifier:{normalizedEmail}";

    private static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return "unknown";
        }

        var atIndex = email.IndexOf('@');
        if (atIndex <= 1)
        {
            return "***";
        }

        return $"{email[0]}***{email[(atIndex - 1)..]}";
    }

    private sealed record IpFailureState(DateTimeOffset WindowStartedUtc, int FailureCount)
    {
        public DateTimeOffset WindowStartedUtc { get; set; } = WindowStartedUtc;
        public int FailureCount { get; set; } = FailureCount;
    }

    private sealed record IdentifierFailureState(int FailureCount, DateTimeOffset? LockedUntilUtc)
    {
        public int FailureCount { get; set; } = FailureCount;
        public DateTimeOffset? LockedUntilUtc { get; set; } = LockedUntilUtc;
    }
}

public sealed record LoginAttemptDecision(bool IsAllowed, string? Message)
{
    public static LoginAttemptDecision Allowed() => new(true, null);

    public static LoginAttemptDecision Blocked(string message) => new(false, message);
}
