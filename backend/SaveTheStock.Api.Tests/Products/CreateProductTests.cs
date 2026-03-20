using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Controllers.Products;

public sealed class CreateProductTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly SaveTheStockApiFactory _factory;

    public CreateProductTests(SaveTheStockApiFactory factory) => _factory = factory;

    [Fact]
    public async Task WhenUnauthorized_ShouldReturn401()
    {
        var client = _factory.CreateClient();

        var req = new CreateProductRequest(Guid.NewGuid(), "Tomates", "kg", 5, true);
        var res = await client.PostAsJsonAsync("/api/products", req);

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task WithValidPayload_ShouldReturn201()
    {
        var (client, _) = await CreateAuthedClientAsync();

        var categoryId = await CreateCategoryAsync(client, "Legumes");

        var req = new CreateProductRequest(categoryId, "Tomates", "kg", 5, true);
        var res = await client.PostAsJsonAsync("/api/products", req);

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(body);
        Assert.Equal(categoryId, body!.CategoryId);
        Assert.Equal("TOMATES", body.Name);
        Assert.Equal("kg", body.Unit);
    }

    [Fact]
    public async Task WhenDuplicateNameInSameTenant_ShouldReturn409()
    {
        var (client, _) = await CreateAuthedClientAsync();

        var categoryId = await CreateCategoryAsync(client, "Legumes");

        var req1 = new CreateProductRequest(categoryId, "Tomates", "kg", 5, true);
        var req2 = new CreateProductRequest(categoryId, "tomates", "kg", 5, true);

        var r1 = await client.PostAsJsonAsync("/api/products", req1);
        Assert.Equal(HttpStatusCode.Created, r1.StatusCode);

        var r2 = await client.PostAsJsonAsync("/api/products", req2);
        Assert.Equal(HttpStatusCode.Conflict, r2.StatusCode);
    }

    [Fact]
    public async Task WhenCategoryDoesNotExist_ShouldReturn404()
    {
        var (client, _) = await CreateAuthedClientAsync();

        var req = new CreateProductRequest(Guid.NewGuid(), "Tomates", "kg", 5, true);
        var res = await client.PostAsJsonAsync("/api/products", req);

        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    private async Task<(HttpClient Client, Guid CompanyId)> CreateAuthedClientAsync()
    {
        var client = _factory.CreateClient();

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(client, $"Company_{Guid.NewGuid():N}");
        var email = $"{Guid.NewGuid():N}@test.local";
        var password = "P@ssw0rd!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            displayName: "Test User",
            role: "Owner",
            password: password);

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
}