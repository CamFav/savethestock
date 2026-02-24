using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class DeleteAccountTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public DeleteAccountTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Delete_ShouldSoftDeleteAccount()
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
        var deleteResponse = await _client.DeleteAsync(
            $"/api/accounts/{account!.Id}?companyId={companyId}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // vérifie qu’il ne ressort plus dans la liste
        var listResponse = await _client.GetAsync(
            $"/api/accounts?companyId={companyId}");

        var accounts = await listResponse.Content
            .ReadFromJsonAsync<List<AccountResponse>>();

        Assert.NotNull(accounts);
        Assert.Empty(accounts!);
    }
}