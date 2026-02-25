using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

/// <summary>
/// Tests for the PUT /api/accounts/{accountId} endpoint.
/// </summary>
public sealed class UpdateAccountTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public UpdateAccountTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Update_ShouldModifyFields()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string ownerEmail = "owner-update@test.com";
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

        // Act
        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/accounts/{account!.Id}",
            new UpdateAccountRequest(
                "updated@test.com",
                "Updated Name",
                false
            ));

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

        var listResponse = await _client.GetAsync("/api/accounts");

        var accounts = await listResponse.Content
            .ReadFromJsonAsync<List<AccountResponse>>();

        var updated = accounts!.Single(a => a.Id == account!.Id);

        Assert.Equal("updated@test.com", updated.Email);
        Assert.Equal("Updated Name", updated.DisplayName);
        Assert.False(updated.IsActive);
    }
}
