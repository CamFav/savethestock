using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Categories;

public sealed class DeleteCategoryTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public DeleteCategoryTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Delete_WithoutToken_ShouldReturn401()
    {
        var response = await _client.DeleteAsync($"/api/categories/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AsMember_ShouldReturn403()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Delete 403");

        const string memberPassword = "MemberPassword123!";
        const string memberEmail = "member-cat-delete@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, memberEmail, "Member", "Member", memberPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, memberEmail, memberPassword);

        var response = await _client.DeleteAsync($"/api/categories/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_HappyPath_ShouldReturn204_AndThenGetByIdShould404()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Delete OK");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-delete-ok@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var create = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = await create.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(created);

        var delete = await _client.DeleteAsync($"/api/categories/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var get = await _client.GetAsync($"/api/categories/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldBeIdempotent()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Delete Idempotent");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-delete-idem@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var create = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = await create.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(created);

        var first = await _client.DeleteAsync($"/api/categories/{created!.Id}");
        var second = await _client.DeleteAsync($"/api/categories/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, second.StatusCode);
    }

    [Fact]
    public async Task Delete_ShouldAllowRecreateSameNameAfterSoftDelete()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Delete Recreate");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-delete-recreate@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var create1 = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        Assert.Equal(HttpStatusCode.Created, create1.StatusCode);

        var cat1 = await create1.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(cat1);

        var delete = await _client.DeleteAsync($"/api/categories/{cat1!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var create2 = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("  beverages "));
        Assert.Equal(HttpStatusCode.Created, create2.StatusCode);
    }
}