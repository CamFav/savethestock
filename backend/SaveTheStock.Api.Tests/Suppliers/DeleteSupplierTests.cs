using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Suppliers;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Suppliers;

public sealed class DeleteSupplierTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public DeleteSupplierTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Delete_ShouldBeIdempotent_AndRemovedFromReadModels()
    {
        var client = await CreateOwnerClientAsync();

        var created = await CreateSupplierAsync(client, "Fresh Foods");

        var firstDelete = await client.DeleteAsync($"/api/suppliers/{created.Id}");
        var secondDelete = await client.DeleteAsync($"/api/suppliers/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, firstDelete.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, secondDelete.StatusCode);

        var getById = await client.GetAsync($"/api/suppliers/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getById.StatusCode);

        var getPaged = await client.GetAsync("/api/suppliers?page=1&pageSize=20");
        Assert.Equal(HttpStatusCode.OK, getPaged.StatusCode);

        var payload = await getPaged.Content.ReadFromJsonAsync<PagedSuppliersResponse>();
        Assert.NotNull(payload);
        Assert.DoesNotContain(payload!.Items, x => x.Id == created.Id);
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
