using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Suppliers;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Suppliers;

public sealed class GetSuppliersPagedTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public GetSuppliersPagedTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetPaged_ShouldReturn200_WithItems()
    {
        var client = await CreateOwnerClientAsync();

        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/suppliers", new CreateSupplierRequest("Bravo"))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/suppliers", new CreateSupplierRequest("Alpha"))).StatusCode);

        var response = await client.GetAsync("/api/suppliers?page=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedSuppliersResponse>();
        Assert.NotNull(payload);
        Assert.True(payload!.Total >= 2);
        Assert.True(payload.Items.Count >= 2);
    }

    private async Task<HttpClient> CreateOwnerClientAsync()
    {
        var client = _factory.CreateClient();

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(client, $"SupplierCompany_{Guid.NewGuid():N}");

        var email = $"owner-supplier-{Guid.NewGuid():N}@test.local";
        const string password = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            "Owner Supplier",
            "Owner",
            password);

        await AccountsAuthTestHelper.AuthenticateAsync(client, email, password);

        return client;
    }
}
