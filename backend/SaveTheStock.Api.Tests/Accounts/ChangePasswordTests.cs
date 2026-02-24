using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class ChangePasswordTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public ChangePasswordTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ChangePassword_ShouldRemoveTempPrefix()
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

        Assert.True(account!.MustChangePassword);

        // Act
        var response = await _client.PutAsJsonAsync(
            $"/api/accounts/me/password?accountId={account.Id}",
            new ChangeMyPasswordRequest("NewSecurePassword123!")
        );

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listResponse = await _client.GetAsync(
            $"/api/accounts?companyId={companyId}");

        var accounts = await listResponse.Content
            .ReadFromJsonAsync<List<AccountResponse>>();

        var updated = accounts!.Single();

        Assert.False(updated.MustChangePassword);
    }
}