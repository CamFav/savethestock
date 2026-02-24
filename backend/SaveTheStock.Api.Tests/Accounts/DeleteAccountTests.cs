using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class DeleteAccountTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public DeleteAccountTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Delete_ShouldSoftDeleteAccount()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string ownerEmail = "owner-delete@test.com";
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

        Assert.Equal(HttpStatusCode.Created, inviteResponse.StatusCode);

        var account = await inviteResponse.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        var deleteResponse = await _client.DeleteAsync($"/api/accounts/{account!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var listResponse = await _client.GetAsync("/api/accounts");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var accounts = await listResponse.Content.ReadFromJsonAsync<List<AccountResponse>>();

        Assert.NotNull(accounts);
        Assert.DoesNotContain(accounts!, a => a.Id == account.Id);
    }
}
