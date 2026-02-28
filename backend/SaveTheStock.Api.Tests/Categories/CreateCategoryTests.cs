using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Categories;

/// <summary>
/// Tests for the POST /api/categories endpoint.
/// </summary>
public sealed class CreateCategoryTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public CreateCategoryTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_WithoutToken_ShouldReturn401()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("Beverages"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_AsOwner_ShouldReturn201_AndPayload()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Categories");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-categories@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner Categories",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        // Act
        var response = await _client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("Beverages"));

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(payload);

        Assert.Equal(company.Id, payload!.CompanyId);
        Assert.False(payload.Id == Guid.Empty);
        Assert.Equal("BEVERAGES", payload.Name);
    }

    [Fact]
    public async Task Create_AsMember_ShouldReturn403()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Categories 403");

        const string memberPassword = "MemberPassword123!";
        const string memberEmail = "member-categories@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            memberEmail,
            "Member Categories",
            "Member",
            memberPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, memberEmail, memberPassword);

        // Act
        var response = await _client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("Beverages"));

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_DuplicateName_ShouldReturn409()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Categories 409");

        const string ownerPassword = "OwnerPassword123!";
        const string ownerEmail = "owner-categories-409@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner Categories 409",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        // Act
        var first = await _client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("  Beverages  "));

        var second = await _client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("beverages"));

        // Assert
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}