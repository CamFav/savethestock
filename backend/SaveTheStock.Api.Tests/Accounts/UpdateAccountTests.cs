using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class UpdateAccountTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public UpdateAccountTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Update_ShouldModifyFields()
    {
        // Arrange
        var companyResponse = await _client.PostAsJsonAsync(
            "/api/companies",
            new CreateCompanyRequest { Name = "Test Company" });

        var company = await companyResponse.Content
            .ReadFromJsonAsync<CompanyResponse>();

        var companyId = company!.Id;

        var inviteResponse = await _client.PostAsJsonAsync(
            $"/api/accounts/invite?companyId={companyId}",
            new InviteAccountRequest(
                "member@test.com",
                "Member"
            ));

        var account = await inviteResponse.Content
            .ReadFromJsonAsync<AccountResponse>();

        // Act
        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/accounts/{account!.Id}?companyId={companyId}",
            new UpdateAccountRequest(
                "updated@test.com",
                "Updated Name",
                false
            ));

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

        var listResponse = await _client.GetAsync(
            $"/api/accounts?companyId={companyId}");

        var accounts = await listResponse.Content
            .ReadFromJsonAsync<List<AccountResponse>>();

        var updated = accounts!.Single();

        Assert.Equal("updated@test.com", updated.Email);
        Assert.Equal("Updated Name", updated.DisplayName);
        Assert.False(updated.IsActive);
    }
}