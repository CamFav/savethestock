using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Controllers.Products;

public sealed class GetProductsPagedTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public GetProductsPagedTests(SaveTheStockApiFactory factory) => _factory = factory;

    [Fact]
    public async Task WhenUnauthorized_ShouldReturn401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/products?page=1&pageSize=20");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task WhenHasItems_ShouldReturn200WithPagedResponse()
    {
        var client = (await CreateAuthedClientAsync()).Client;

        var categoryId = await CreateCategoryAsync(client, "Legumes");
        await CreateProductAsync(client, categoryId, "Tomates");
        await CreateProductAsync(client, categoryId, "Pommes");

        var res = await client.GetAsync("/api/products?page=1&pageSize=20");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<PagedProductsResponse>();
        Assert.NotNull(body);
        Assert.True(body!.Total >= 2);
        Assert.NotEmpty(body.Items);
    }

    [Fact]
    public async Task WithCategoryFilter_ShouldReturnOnlyThatCategory()
    {
        var client = (await CreateAuthedClientAsync()).Client;

        var catA = await CreateCategoryAsync(client, "A");
        var catB = await CreateCategoryAsync(client, "B");

        await CreateProductAsync(client, catA, "Tomates");
        await CreateProductAsync(client, catB, "Pommes");

        var res = await client.GetAsync($"/api/products?page=1&pageSize=20&categoryId={catA}");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<PagedProductsResponse>();
        Assert.NotNull(body);
        Assert.All(body!.Items, p => Assert.Equal(catA, p.CategoryId));
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
        return (await res.Content.ReadFromJsonAsync<ProductResponse>())!.Id;
    }
}