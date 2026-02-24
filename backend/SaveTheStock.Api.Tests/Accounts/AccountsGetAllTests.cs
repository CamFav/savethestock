using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class GetAccountsTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public GetAccountsTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAccounts_ShouldReturnOnlyAccountsOfGivenCompany()
    {
        // Arrange

        // create a company
        var createCompanyResponse = await _client.PostAsJsonAsync(
            "/api/companies",
            new CreateCompanyRequest { Name = "Test Company" });

        var company = await createCompanyResponse.Content
            .ReadFromJsonAsync<CompanyResponse>();

        Assert.NotNull(company);
        var companyId = company!.Id;

        // invite
        await _client.PostAsJsonAsync(
            $"/api/accounts/invite?companyId={companyId}",
            new InviteAccountRequest(
                "member@test.com",
                "Member"
            ));

        // Act
        var response = await _client.GetAsync(
            $"/api/accounts?companyId={companyId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var accounts = await response.Content
            .ReadFromJsonAsync<List<AccountResponse>>();

        Assert.NotNull(accounts);
        Assert.Single(accounts);

        var account = accounts![0];

        Assert.Equal("member@test.com", account.Email);
        Assert.Equal("Member", account.DisplayName);
        Assert.Equal("Member", account.Role);
        Assert.True(account.MustChangePassword);
        Assert.Null(account.DeletedAt);
    }
}