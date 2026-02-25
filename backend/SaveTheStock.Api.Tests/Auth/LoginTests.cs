using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Auth;

/// <summary>
/// Tests for the POST /api/auth/login endpoint.
/// </summary>
public sealed class LoginTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public LoginTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ShouldAuthenticateWithoutCompanyId_AndIncludeClaims()
    {
        var email = $"member-{Guid.NewGuid():N}@test.com";
        const string password = "NewSecurePassword123!";

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Auth Company");

        var accountId = await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            "Member",
            "Member",
            password);

        var loginResponse = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest($"  {email.ToUpperInvariant()}  ", password));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var payload = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(payload);
        Assert.False(payload!.MustChangePassword);
        Assert.False(string.IsNullOrWhiteSpace(payload.AccessToken));

        var token = new JwtSecurityTokenHandler().ReadJwtToken(payload.AccessToken);

        Assert.Contains(token.Claims, c => c.Type == "account_id" && c.Value == accountId.ToString());
        Assert.Contains(token.Claims, c => c.Type == "company_id" && c.Value == company.Id.ToString());
        Assert.Contains(token.Claims, c =>
            (c.Type == ClaimTypes.Role || c.Type == "role") &&
            c.Value == "Member");
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenAccountSoftDeleted()
    {
        var email = $"deleted-{Guid.NewGuid():N}@test.com";
        const string password = "NewSecurePassword123!";

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Deleted Company");

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            "Member",
            "Member",
            password,
            isActive: false,
            deletedAt: DateTime.UtcNow);

        var loginResponse = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(email, password));

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }
}
