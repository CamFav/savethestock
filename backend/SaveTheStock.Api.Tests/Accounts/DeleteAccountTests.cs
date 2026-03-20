using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Tests.Testing;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

/// <summary>
/// Tests for the DELETE /api/accounts/{accountId} endpoint.
/// </summary>
public sealed class DeleteAccountTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public DeleteAccountTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Delete_WithoutBusinessHistory_ShouldHardDeleteMemberAccount()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string ownerEmail = "owner-delete@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var inviteResponse = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest("member@test.com", "Member"));

        Assert.Equal(HttpStatusCode.Created, inviteResponse.StatusCode);

        var account = await inviteResponse.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        var deleteResponse = await _client.DeleteAsync($"/api/accounts/{account!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deleted = await db.Accounts.FirstOrDefaultAsync(a => a.Id == account.Id);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task Delete_WithBusinessHistory_ShouldAnonymizeMemberAccount()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company History");
        const string ownerEmail = "owner-history@test.com";
        const string ownerPassword = "OwnerPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var inviteResponse = await _client.PostAsJsonAsync(
            "/api/accounts/invite",
            new InviteAccountRequest("member-history@test.com", "Member History"));

        var account = await inviteResponse.Content.ReadFromJsonAsync<AccountResponse>();
        Assert.NotNull(account);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Receptions.Add(new Reception
            {
                Id = Guid.NewGuid(),
                CompanyId = company.Id,
                ReceptionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Status = "Draft",
                AccountId = account!.Id,
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var deleteResponse = await _client.DeleteAsync($"/api/accounts/{account!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deleted = await verifyDb.Accounts.FirstOrDefaultAsync(a => a.Id == account.Id);
        Assert.NotNull(deleted);
        Assert.Equal(Account.DeletedDisplayName, deleted!.DisplayName);
        Assert.False(deleted.IsActive);
        Assert.NotNull(deleted.DeletedAt);
    }

    [Fact]
    public async Task Delete_LastOwner_ShouldReturnBadRequest()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Owner Guard Company");
        const string ownerEmail = "owner-last@test.com";
        const string ownerPassword = "OwnerPassword123!";

        var ownerId = await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            ownerPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, ownerPassword);

        var deleteResponse = await _client.DeleteAsync($"/api/accounts/{ownerId}");
        Assert.Equal(HttpStatusCode.BadRequest, deleteResponse.StatusCode);
    }
}
