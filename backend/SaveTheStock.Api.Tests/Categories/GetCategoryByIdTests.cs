using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Categories;

public sealed class GetCategoryByIdTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public GetCategoryByIdTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetById_WithoutToken_ShouldReturn401()
    {
        var response = await _client.GetAsync($"/api/categories/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ShouldReturn404()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat 404");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-404@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        // Act
        var response = await _client.GetAsync($"/api/categories/{Guid.NewGuid()}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_WhenOtherTenant_ShouldReturn404()
    {
        // Arrange
        var companyA = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company A Cat");
        var companyB = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company B Cat");

        const string ownerAPassword = "OwnerAPassword123!";
        const string ownerBPassword = "OwnerBPassword123!";

        const string ownerAEmail = "owner-a-cat@test.com";
        const string ownerBEmail = "owner-b-cat@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(_factory, companyA.Id, ownerAEmail, "Owner A", "Owner", ownerAPassword);
        await AccountsAuthTestHelper.SeedAccountAsync(_factory, companyB.Id, ownerBEmail, "Owner B", "Owner", ownerBPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerAEmail, ownerAPassword);

        var create = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = await create.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(created);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerBEmail, ownerBPassword);

        // Act
        var response = await _client.GetAsync($"/api/categories/{created!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_HappyPath_ShouldReturn200()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat OK");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-ok@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var create = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = await create.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(created);

        // Act
        var response = await _client.GetAsync($"/api/categories/{created!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(payload);

        Assert.Equal(created.Id, payload!.Id);
        Assert.Equal(company.Id, payload.CompanyId);
        Assert.Equal("BEVERAGES", payload.Name);
    }
}