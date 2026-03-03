using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Companies;

/// <summary>
/// Tests for the POST /api/companies endpoint.
/// </summary>
public sealed class CreateCompanyTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public CreateCompanyTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateCompany_ShouldReturn401Unauthorized()
    {
        var request = new CreateCompanyRequest { Name = "Test Company" };

        var response = await _client.PostAsJsonAsync("/api/companies", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateCompany_WithEmptyName_ShouldReturn401Unauthorized()
    {
        var request = new CreateCompanyRequest { Name = "   " };

        var response = await _client.PostAsJsonAsync("/api/companies", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
