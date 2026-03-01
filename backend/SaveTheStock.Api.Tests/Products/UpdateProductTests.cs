using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Controllers.Products;

public sealed class UpdateProductTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public UpdateProductTests(SaveTheStockApiFactory factory) => _factory = factory;

    [Fact]
    public async Task WhenUnauthorized_ShouldReturn401()
    {
        var client = _factory.CreateClient();

        var req = new UpdateProductRequest(Guid.NewGuid(), "Tomates", "kg", 5, true);
        var res = await client.PutAsJsonAsync($"/api/products/{Guid.NewGuid()}", req);

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task WhenValid_ShouldReturn200()
    {
        var client = (await CreateAuthedClientAsync()).Client;

        var categoryId = await CreateCategoryAsync(client, "Legumes");
        var productId = await CreateProductAsync(client, categoryId, "Tomates");

        var req = new UpdateProductRequest(categoryId, "Tomates cerises", "kg", 3, true);
        var res = await client.PutAsJsonAsync($"/api/products/{productId}", req);

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(body);
        Assert.Equal("TOMATES CERISES", body!.Name);
        Assert.Equal(3, body.AlertThreshold);
    }

    [Fact]
    public async Task WhenDuplicateName_ShouldReturn409()
    {
        var client = (await CreateAuthedClientAsync()).Client;

        var categoryId = await CreateCategoryAsync(client, "Legumes");

        var p1 = await CreateProductAsync(client, categoryId, "Tomates");
        var p2 = await CreateProductAsync(client, categoryId, "Pommes");

        var req = new UpdateProductRequest(categoryId, "Tomates", "kg", 5, true);
        var res = await client.PutAsJsonAsync($"/api/products/{p2}", req);

        Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
    }

    private async Task<(HttpClient Client, Guid CompanyId)> CreateAuthedClientAsync()
    {
        var client = _factory.CreateClient();

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(client, $"Company_{Guid.NewGuid():N}");
        var email = $"{Guid.NewGuid():N}@test.local";
        var password = "P@ssw0rd!";

        await AccountsAuthTestHelper.SeedAccountAsync(_factory, company.Id, email, "Owner", "Owner", password);
        await AccountsAuthTestHelper.AuthenticateAsync(client, email, password);

        return (client, company.Id);
    }

    private static async Task<Guid> CreateCategoryAsync(HttpClient client, string name)
    {
        var res = await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest(name));
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<CategoryResponse>())!.Id;
    }

    private static async Task<Guid> CreateProductAsync(HttpClient client, Guid categoryId, string name)
    {
        var res = await client.PostAsJsonAsync("/api/products",
            new CreateProductRequest(categoryId, name, "kg", 5, true));
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<ProductResponse>())!.Id;
    }
}