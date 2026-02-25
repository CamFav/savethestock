using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class InviteAccountTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public InviteAccountTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Invite_ShouldRejectSameEmailAcrossCompanies()
    {
        var email = $"global-{Guid.NewGuid():N}@test.com";

        var companyA = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company A");
        var companyB = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company B");

        const string ownerAPassword = "OwnerAPassword123!";
        const string ownerBPassword = "OwnerBPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, companyA.Id, "owner-a@test.com", "Owner A", "Owner", ownerAPassword);
        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, companyB.Id, "owner-b@test.com", "Owner B", "Owner", ownerBPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, "owner-a@test.com", ownerAPassword);

        var firstInvite = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest(email, "Member A"));

        Assert.Equal(HttpStatusCode.Created, firstInvite.StatusCode);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, "owner-b@test.com", ownerBPassword);

        var duplicateInvite = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest(email.ToUpperInvariant(), "Member B"));

        Assert.Equal(HttpStatusCode.BadRequest, duplicateInvite.StatusCode);
    }

    [Fact]
    public async Task Invite_ShouldStillRejectSoftDeletedEmail_WhenUniquenessIsStrict()
    {
        var email = $"deleted-global-{Guid.NewGuid():N}@test.com";

        var companyA = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company A - Deleted");
        var companyB = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company B - Deleted");

        const string ownerAPassword = "OwnerAPassword123!";
        const string ownerBPassword = "OwnerBPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, companyA.Id, "owner-a-deleted@test.com", "Owner A", "Owner", ownerAPassword);
        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory, companyB.Id, "owner-b-deleted@test.com", "Owner B", "Owner", ownerBPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, "owner-a-deleted@test.com", ownerAPassword);

        var firstInvite = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest(email, "Member A"));

        Assert.Equal(HttpStatusCode.Created, firstInvite.StatusCode);

        var account = await firstInvite.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        var deleteResponse = await _client.DeleteAsync($"/api/accounts/{account!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, "owner-b-deleted@test.com", ownerBPassword);

        var duplicateInvite = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest(email, "Member B"));

        Assert.Equal(HttpStatusCode.BadRequest, duplicateInvite.StatusCode);
    }

    [Fact]
    public async Task Invite_WithoutToken_ShouldReturn401()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest("anonymous@test.com", "Anonymous"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Invite_WithInvalidToken_ShouldReturn401()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");

        var response = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest("invalid@test.com", "Invalid"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Invite_WhenMember_ShouldReturn403()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company 403");

        const string memberPassword = "MemberPassword123!";
        const string memberEmail = "member403@test.com";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            memberEmail,
            "Member 403",
            "Member",
            memberPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, memberEmail, memberPassword);

        // Act
        var response = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest("newuser@test.com", "New User"));

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
