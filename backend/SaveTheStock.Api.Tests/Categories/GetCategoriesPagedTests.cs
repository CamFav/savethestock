using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Categories;

public sealed class GetCategoriesPagedTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public GetCategoriesPagedTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetPaged_WithoutToken_ShouldReturn401()
    {
        var response = await _client.GetAsync("/api/categories?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPaged_AsOwner_ShouldReturnPagedSortedByNameAsc()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Categories List");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-categories-list@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner Categories List",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var post1 = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("zzz"));
        var post2 = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("aaa"));

        Assert.Equal(HttpStatusCode.Created, post1.StatusCode);
        Assert.Equal(HttpStatusCode.Created, post2.StatusCode);

        // Act
        var response = await _client.GetAsync("/api/categories?page=1&pageSize=10");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedCategoryResponse>();
        Assert.NotNull(payload);

        Assert.Equal(2, payload!.Total);
        Assert.Equal(1, payload.Page);
        Assert.Equal(10, payload.PageSize);
        Assert.Equal(2, payload.Items.Count);

        Assert.Equal("AAA", payload.Items[0].Name);
        Assert.Equal("ZZZ", payload.Items[1].Name);

        Assert.All(payload.Items, i => Assert.Equal(company.Id, i.CompanyId));
    }

    [Fact]
    public async Task GetPaged_ShouldPaginate()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Categories Paging");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-categories-paging@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner Categories Paging",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        // Create 3 categories
        Assert.Equal(HttpStatusCode.Created, (await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("c"))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("b"))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("a"))).StatusCode);

        // Act: pageSize=2
        var page1 = await _client.GetFromJsonAsync<PagedCategoryResponse>("/api/categories?page=1&pageSize=2");
        var page2 = await _client.GetFromJsonAsync<PagedCategoryResponse>("/api/categories?page=2&pageSize=2");

        // Assert
        Assert.NotNull(page1);
        Assert.NotNull(page2);

        Assert.Equal(3, page1!.Total);
        Assert.Equal(2, page1.Items.Count);
        Assert.Equal("A", page1.Items[0].Name);
        Assert.Equal("B", page1.Items[1].Name);

        Assert.Equal(3, page2!.Total);
        Assert.Single(page2.Items);
        Assert.Equal("C", page2.Items[0].Name);
    }
}