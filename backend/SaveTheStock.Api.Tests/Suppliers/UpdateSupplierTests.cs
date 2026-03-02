using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Suppliers;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Suppliers;

public sealed class UpdateSupplierTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public UpdateSupplierTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Update_ShouldReturn204_AndPersistNormalizedName()
    {
        var client = await CreateOwnerClientAsync();

        var created = await CreateSupplierAsync(client, "Fresh Foods");

        var update = await client.PutAsJsonAsync(
            $"/api/suppliers/{created.Id}",
            new UpdateSupplierRequest("New  Name"));

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);

        var get = await client.GetAsync($"/api/suppliers/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);

        var payload = await get.Content.ReadFromJsonAsync<SupplierResponse>();
        Assert.NotNull(payload);
        Assert.Equal("NEW NAME", payload!.Name);
    }

    [Fact]
    public async Task Update_DuplicateName_ShouldReturn409()
    {
        var client = await CreateOwnerClientAsync();

        var supplierA = await CreateSupplierAsync(client, "AAA");
        var supplierB = await CreateSupplierAsync(client, "BBB");

        var update = await client.PutAsJsonAsync(
            $"/api/suppliers/{supplierB.Id}",
            new UpdateSupplierRequest(" aaa "));

        Assert.Equal(HttpStatusCode.Conflict, update.StatusCode);

        // ensures setup stayed valid and A exists
        Assert.NotEqual(Guid.Empty, supplierA.Id);
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
