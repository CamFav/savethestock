using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class GetAccountByIdTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public GetAccountByIdTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetById_ShouldReturnAccount()
    {
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

        var response = await _client.GetAsync(
            $"/api/accounts/{account!.Id}?companyId={companyId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content
            .ReadFromJsonAsync<AccountResponse>();

        Assert.NotNull(result);
        Assert.Equal(account.Id, result!.Id);
        Assert.Equal("member@test.com", result.Email);
    }
}