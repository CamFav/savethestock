using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class GetAccountsTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public GetAccountsTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAccounts_ShouldReturnOnlyAccountsOfGivenCompany()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string ownerEmail = "owner@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            factory: _factory,
            companyId: company.Id,
            email: ownerEmail,
            displayName: "Owner",
            role: "Owner",
            password: ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var inviteResponse = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest("member@test.com", "Member"));

        Assert.Equal(HttpStatusCode.Created, inviteResponse.StatusCode);

        // Act
        var response = await _client.GetAsync("/api/accounts");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var accounts = await response.Content
            .ReadFromJsonAsync<List<AccountResponse>>();

        Assert.NotNull(accounts);
        var account = accounts!.Single(a => a.Email == "member@test.com");
        Assert.Equal("member@test.com", account.Email);
        Assert.Equal("Member", account.DisplayName);
        Assert.Equal("Member", account.Role);
        Assert.True(account.MustChangePassword);
        Assert.Null(account.DeletedAt);
    }

    [Fact]
    public async Task GetAccounts_WithoutToken_ShouldReturn401()
    {
        var response = await _client.GetAsync("/api/accounts");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAccounts_WithInvalidToken_ShouldReturn401()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var response = await _client.GetAsync("/api/accounts");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
