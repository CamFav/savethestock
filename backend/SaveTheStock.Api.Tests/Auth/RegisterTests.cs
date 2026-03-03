using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Auth;

/// <summary>
/// Tests for POST /api/auth/register.
/// </summary>
public sealed class RegisterTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public RegisterTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ShouldCreateCompanyOwner_AndReturnLoginPayload()
    {
        var request = new RegisterRequest(
            CompanyName: "Acme",
            OwnerDisplayName: "Alice Owner",
            OwnerEmail: "alice.owner@test.com",
            Password: "OwnerPassword123!");

        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload!.JwtToken));
        Assert.Equal("Owner", payload.Role);
        Assert.Equal("Alice Owner", payload.DisplayName);
        Assert.NotEqual(Guid.Empty, payload.AccountId);
        Assert.NotEqual(Guid.Empty, payload.CompanyId);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, request.OwnerEmail, request.Password);

        var accountsResponse = await _client.GetAsync("/api/accounts");
        Assert.Equal(HttpStatusCode.OK, accountsResponse.StatusCode);

        var accounts = await accountsResponse.Content.ReadFromJsonAsync<List<AccountResponse>>();
        Assert.NotNull(accounts);

        var owner = accounts!.Single(a => a.Id == payload.AccountId);
        Assert.Equal(payload.CompanyId, owner.CompanyId);
        Assert.Equal("Owner", owner.Role);
        Assert.False(owner.MustChangePassword);
        Assert.True(owner.IsActive);
        Assert.Null(owner.DeletedAt);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturn400()
    {
        var first = new RegisterRequest(
            CompanyName: "Company A",
            OwnerDisplayName: "Owner A",
            OwnerEmail: "duplicate@test.com",
            Password: "Password123!");

        var second = new RegisterRequest(
            CompanyName: "Company B",
            OwnerDisplayName: "Owner B",
            OwnerEmail: "  DUPLICATE@test.com  ",
            Password: "Password123!");

        var firstResponse = await _client.PostAsJsonAsync("/api/auth/register", first);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        var secondResponse = await _client.PostAsJsonAsync("/api/auth/register", second);
        Assert.Equal(HttpStatusCode.BadRequest, secondResponse.StatusCode);
    }

    [Fact]
    public async Task Register_ShouldAllowLoginWithRegisteredCredentials()
    {
        var request = new RegisterRequest(
            CompanyName: "Login Company",
            OwnerDisplayName: "Login Owner",
            OwnerEmail: "login-owner@test.com",
            Password: "OwnerPassword123!");

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", request);
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var loginResponse = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(request.OwnerEmail, request.Password));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var payload = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(payload);
        Assert.Equal("Owner", payload!.Role);
        Assert.Equal(request.OwnerDisplayName, payload.DisplayName);
    }
}
