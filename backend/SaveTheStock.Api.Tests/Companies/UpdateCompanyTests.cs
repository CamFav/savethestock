using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Companies;

/// <summary>
/// Tests for the PUT /api/companies/{companyId} endpoint.
/// </summary>
public sealed class UpdateCompanyTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public UpdateCompanyTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UpdateCompany_WithoutToken_ShouldReturn401()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "No Token Company");

        var response = await _client.PutAsJsonAsync(
            $"/api/companies/{company.Id}",
            new UpdateCompanyRequest { Name = "New Name" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCompany_WhenMember_ShouldReturn403()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Member Company");
        const string memberEmail = "member-company-update@test.com";
        const string memberPassword = "MemberPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            memberEmail,
            "Member",
            "Member",
            memberPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, memberEmail, memberPassword);

        var response = await _client.PutAsJsonAsync(
            $"/api/companies/{company.Id}",
            new UpdateCompanyRequest { Name = "New Name" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCompany_WhenOwnerButDifferentCompanyId_ShouldReturn404()
    {
        var companyA = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Owner Company A");
        var companyB = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Owner Company B");
        const string ownerEmail = "owner-company-a@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            companyA.Id,
            ownerEmail,
            "Owner A",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var response = await _client.PutAsJsonAsync(
            $"/api/companies/{companyB.Id}",
            new UpdateCompanyRequest { Name = "Should Not Update" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCompany_WhenOwnerAndSameCompanyId_ShouldModifyName()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Old Name");
        const string ownerEmail = "owner-company-update@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/companies/{company!.Id}",
            new UpdateCompanyRequest { Name = "New Name" });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updated = await updateResponse.Content.ReadFromJsonAsync<CompanyResponse>();

        Assert.Equal("New Name", updated!.Name);
    }
}
