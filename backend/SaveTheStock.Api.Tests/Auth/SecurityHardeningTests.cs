using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Auth;

public sealed class SecurityHardeningTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public SecurityHardeningTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_ShouldReturnValidationProblem_WhenPayloadIsInvalid()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new
            {
                Email = "not-an-email",
                Password = ""
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(payload);
        Assert.Equal("Validation failed.", payload!.Title);
        Assert.Contains(nameof(LoginRequest.Email), payload.Errors.Keys);
        Assert.Contains(nameof(LoginRequest.Password), payload.Errors.Keys);
    }

    [Fact]
    public async Task Login_ShouldThrottleByIp_AfterConfiguredNumberOfFailures()
    {
        using var factory = CreateConfiguredFactory(new Dictionary<string, string?>
        {
            ["Security:LoginProtection:MaxFailedAttemptsPerIpWindow"] = "2",
            ["Security:LoginProtection:IpWindowMinutes"] = "10",
            ["Security:LoginProtection:MaxFailedAttemptsPerIdentifier"] = "50",
            ["Security:LoginProtection:LockoutMinutes"] = "1",
        });
        using var client = factory.CreateClient();

        var firstResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("missing-1@test.com", "WrongPassword123!"));
        var secondResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("missing-2@test.com", "WrongPassword123!"));
        var throttledResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest("missing-3@test.com", "WrongPassword123!"));

        Assert.Equal(HttpStatusCode.Unauthorized, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, secondResponse.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, throttledResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ShouldTemporarilyLockIdentifier_AfterConfiguredFailures()
    {
        using var factory = CreateConfiguredFactory(new Dictionary<string, string?>
        {
            ["Security:LoginProtection:MaxFailedAttemptsPerIdentifier"] = "3",
            ["Security:LoginProtection:LockoutMinutes"] = "1",
            ["Security:LoginProtection:MaxFailedAttemptsPerIpWindow"] = "50",
            ["Security:LoginProtection:IpWindowMinutes"] = "10",
        });
        using var client = factory.CreateClient();

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(client, "Security Lockout Company");
        const string email = "lockout@test.com";
        const string password = "CorrectPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            company.Id,
            email,
            "Locked User",
            "Member",
            password);

        for (var attempt = 0; attempt < 3; attempt++)
        {
            var wrongPasswordResponse = await client.PostAsJsonAsync(
                "/api/auth/login",
                new LoginRequest(email, "WrongPassword123!"));

            Assert.Equal(HttpStatusCode.Unauthorized, wrongPasswordResponse.StatusCode);
        }

        var lockedResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(email, password));

        Assert.Equal(HttpStatusCode.TooManyRequests, lockedResponse.StatusCode);
    }

    [Fact]
    public async Task CookieMode_ShouldAuthenticateWithCookie_ProtectLogoutWithCsrf_AndClearCookies()
    {
        using var factory = CreateConfiguredFactory(new Dictionary<string, string?>
        {
            ["Security:AuthCookie:Enabled"] = "true",
            ["Security:AuthCookie:RequireSecure"] = "false",
        });
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });

        const string email = "cookie-owner@test.com";
        const string password = "CookiePassword123!";

        var registerResponse = await client.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterRequest(
                CompanyName: "Cookie Security Company",
                OwnerDisplayName: "Cookie Owner",
                OwnerEmail: email,
                Password: password));

        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);
        var csrfToken = ExtractCookieValue(registerResponse, "XSRF-TOKEN");

        var meResponse = await client.GetAsync("/api/accounts/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var csrfFailureResponse = await client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.BadRequest, csrfFailureResponse.StatusCode);

        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", csrfToken);

        var logoutResponse = await client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        var setCookies = string.Join("\n", logoutResponse.Headers.GetValues("Set-Cookie"));
        Assert.Contains("savethestock_access=", setCookies, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("XSRF-TOKEN=", setCookies, StringComparison.OrdinalIgnoreCase);

        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");

        var afterLogoutResponse = await client.GetAsync("/api/accounts/me");
        Assert.Equal(HttpStatusCode.Unauthorized, afterLogoutResponse.StatusCode);
    }

    private WebApplicationFactory<SaveTheStock.Api.Program> CreateConfiguredFactory(
        IReadOnlyDictionary<string, string?> settings)
        => _factory.WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, configuration) =>
                configuration.AddInMemoryCollection(settings)));

    private static string ExtractCookieValue(HttpResponseMessage response, string cookieName)
    {
        foreach (var headerValue in response.Headers.GetValues("Set-Cookie"))
        {
            if (!headerValue.StartsWith($"{cookieName}=", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var cookiePair = headerValue.Split(';', 2)[0];
            return cookiePair[(cookieName.Length + 1)..];
        }

        throw new Xunit.Sdk.XunitException($"Cookie '{cookieName}' was not found in the response.");
    }
}
