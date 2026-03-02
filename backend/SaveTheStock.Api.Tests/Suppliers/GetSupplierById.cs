using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Suppliers;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Suppliers;

public sealed class GetSupplierByIdTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public GetSupplierByIdTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetById_WithoutToken_ShouldReturn401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/suppliers/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_WhenExists_ShouldReturn200()
    {
        var client = await CreateOwnerClientAsync();

        var created = await CreateSupplierAsync(client, "Fresh Foods");

        var response = await client.GetAsync($"/api/suppliers/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<SupplierResponse>();
        Assert.NotNull(payload);
        Assert.Equal(created.Id, payload!.Id);
        Assert.Equal("FRESH FOODS", payload.Name);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ShouldReturn404()
    {
        var client = await CreateOwnerClientAsync();

        var response = await client.GetAsync($"/api/suppliers/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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

    private static async Task<SupplierResponse> CreateSupplierAsync(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/suppliers", new CreateSupplierRequest(name));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<SupplierResponse>();
        Assert.NotNull(payload);

        return payload!;
    }
}
