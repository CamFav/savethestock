using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Companies;

/// <summary>
/// Tests for the GET /api/companies endpoint.
/// </summary>
public sealed class GetCompaniesTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public GetCompaniesTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetCompanies_ShouldReturnList()
    {
        await _client.PostAsJsonAsync("/api/companies", new CreateCompanyRequest
        {
            Name = "Company A"
        });

        var response = await _client.GetAsync("/api/companies");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var companies = await response.Content.ReadFromJsonAsync<List<CompanyResponse>>();

        Assert.NotNull(companies);
        Assert.NotEmpty(companies!);
    }
}
