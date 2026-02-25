using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Companies;

/// <summary>
/// Tests for the GET /api/companies/{companyId} endpoint.
/// </summary>
public sealed class GetCompanyByIdTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public GetCompanyByIdTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetCompanyById_WithoutToken_ShouldReturn401()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "No Token Company");

        var response = await _client.GetAsync($"/api/companies/{company.Id}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCompanyById_WhenDifferentCompanyId_ShouldReturn404()
    {
        var companyA = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company A");
        var companyB = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company B");
        const string ownerEmail = "owner-company-read@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            companyA.Id,
            ownerEmail,
            "Owner A",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var response = await _client.GetAsync($"/api/companies/{companyB.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetCompanyById_WhenSameCompanyId_ShouldReturn200()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "My Company");
        const string ownerEmail = "owner-company-self@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var response = await _client.GetAsync($"/api/companies/{company.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<CompanyResponse>();
        Assert.NotNull(payload);
        Assert.Equal(company.Id, payload!.Id);
        Assert.Equal("My Company", payload.Name);
    }
}
