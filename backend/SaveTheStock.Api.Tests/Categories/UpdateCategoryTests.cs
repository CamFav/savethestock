using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Categories;

public sealed class UpdateCategoryTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public UpdateCategoryTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Update_WithoutToken_ShouldReturn401()
    {
        var response = await _client.PutAsJsonAsync(
            $"/api/categories/{Guid.NewGuid()}",
            new UpdateCategoryRequest("NewName"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Update_AsMember_ShouldReturn403()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Update 403");

        const string memberPassword = "MemberPassword123!";
        const string memberEmail = "member-cat-update@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, memberEmail, "Member", "Member", memberPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, memberEmail, memberPassword);

        var response = await _client.PutAsJsonAsync(
            $"/api/categories/{Guid.NewGuid()}",
            new UpdateCategoryRequest("NewName"));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Update_WhenNotFound_ShouldReturn404()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Update 404");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-update-404@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var response = await _client.PutAsJsonAsync(
            $"/api/categories/{Guid.NewGuid()}",
            new UpdateCategoryRequest("NewName"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_WhenOtherTenant_ShouldReturn404()
    {
        var companyA = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company A Cat Update");
        var companyB = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company B Cat Update");

        const string ownerAPassword = "OwnerAPassword123!";
        const string ownerBPassword = "OwnerBPassword123!";

        const string ownerAEmail = "owner-a-cat-update@test.com";
        const string ownerBEmail = "owner-b-cat-update@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(_factory, companyA.Id, ownerAEmail, "Owner A", "Owner", ownerAPassword);
        await AccountsAuthTestHelper.SeedAccountAsync(_factory, companyB.Id, ownerBEmail, "Owner B", "Owner", ownerBPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerAEmail, ownerAPassword);

        var create = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = await create.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(created);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerBEmail, ownerBPassword);

        var update = await _client.PutAsJsonAsync(
            $"/api/categories/{created!.Id}",
            new UpdateCategoryRequest("NewName"));

        Assert.Equal(HttpStatusCode.NotFound, update.StatusCode);
    }

    [Fact]
    public async Task Update_DuplicateName_ShouldReturn409()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Update 409");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-update-409@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var createA = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        var createB = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Food"));

        Assert.Equal(HttpStatusCode.Created, createA.StatusCode);
        Assert.Equal(HttpStatusCode.Created, createB.StatusCode);

        var catB = await createB.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(catB);

        var response = await _client.PutAsJsonAsync(
            $"/api/categories/{catB!.Id}",
            new UpdateCategoryRequest("  beverages "));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Update_HappyPath_ShouldReturn204_AndPersist()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Cat Update OK");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-cat-update-ok@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, company.Id, ownerEmail, "Owner", "Owner", ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var create = await _client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Beverages"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = await create.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(created);

        var update = await _client.PutAsJsonAsync(
            $"/api/categories/{created!.Id}",
            new UpdateCategoryRequest("New Name"));

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);

        var get = await _client.GetAsync($"/api/categories/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);

        var payload = await get.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(payload);

        Assert.Equal("NEW NAME", payload!.Name);
    }
}