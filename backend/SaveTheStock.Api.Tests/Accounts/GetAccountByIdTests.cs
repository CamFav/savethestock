using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class GetAccountByIdTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public GetAccountByIdTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetById_ShouldReturnAccount()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string ownerEmail = "owner-getbyid@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var inviteResponse = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest("member@test.com", "Member"));

        var account = await inviteResponse.Content
            .ReadFromJsonAsync<AccountResponse>();

        var response = await _client.GetAsync(
            $"/api/accounts/{account!.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content
            .ReadFromJsonAsync<AccountResponse>();

        Assert.NotNull(result);
        Assert.Equal(account.Id, result!.Id);
        Assert.Equal("member@test.com", result.Email);
    }
}
