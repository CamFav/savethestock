using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Companies;

public sealed class UpdateCompanyTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public UpdateCompanyTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UpdateCompany_ShouldModifyName()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/companies", new CreateCompanyRequest
        {
            Name = "Old Name"
        });

        var company = await createResponse.Content.ReadFromJsonAsync<CompanyResponse>();

        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/companies/{company!.Id}",
            new UpdateCompanyRequest { Name = "New Name" });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updated = await updateResponse.Content.ReadFromJsonAsync<CompanyResponse>();

        Assert.Equal("New Name", updated!.Name);
    }
}
