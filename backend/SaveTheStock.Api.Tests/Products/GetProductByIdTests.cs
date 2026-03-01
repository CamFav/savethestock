using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Controllers.Products;

public sealed class GetProductByIdTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public GetProductByIdTests(SaveTheStockApiFactory factory) => _factory = factory;

    [Fact]
    public async Task WhenUnauthorized_ShouldReturn401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync($"/api/products/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task WhenExists_ShouldReturn200()
    {
        var client = (await CreateAuthedClientAsync()).Client;

        var categoryId = await CreateCategoryAsync(client, "Legumes");
        var productId = await CreateProductAsync(client, categoryId, "Tomates");

        var res = await client.GetAsync($"/api/products/{productId}");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(body);
        Assert.Equal(productId, body!.Id);
        Assert.Equal(categoryId, body.CategoryId);
    }

    [Fact]
    public async Task WhenNotFound_ShouldReturn404()
    {
        var client = (await CreateAuthedClientAsync()).Client;

        var res = await client.GetAsync($"/api/products/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
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

        var body = await res.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(body);

        return body!.Id;
    }

    private static async Task<Guid> CreateProductAsync(HttpClient client, Guid categoryId, string name)
    {
        var res = await client.PostAsJsonAsync("/api/products",
            new CreateProductRequest(categoryId, name, "kg", 5, true));

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(body);

        return body!.Id;
    }
}