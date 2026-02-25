using System.Net;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Companies;

/// <summary>
/// Tests for the GET /api/companies endpoint.
/// </summary>
public sealed class GetCompaniesTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public GetCompaniesTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetCompanies_WithoutToken_ShouldReturn401()
    {
        var response = await _client.GetAsync("/api/companies");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCompanies_WithToken_ShouldReturn403()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company List Blocked");
        const string ownerEmail = "owner-list@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var response = await _client.GetAsync("/api/companies");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
