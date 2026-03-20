using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Tests.Testing;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

/// <summary>
/// Tests for the DELETE /api/accounts/me endpoint.
/// </summary>
public sealed class DeleteMyAccountTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public DeleteMyAccountTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DeleteMe_WithoutBusinessHistory_ShouldHardDeleteAccount_AndBlockLogin()
    {
        // Arrange
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Self Delete");

        const string email = "member-selfdelete@test.com";
        const string password = "MemberPassword123!";

        var accountId = await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            "Member SelfDelete",
            "Member",
            password);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, email, password);

        // Act
        var deleteResponse = await _client.DeleteAsync("/api/accounts/me");

        // Assert (HTTP)
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Assert (DB)
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId);
            Assert.Null(account);
        }

        // Assert (login blocked)
        var loginResponse = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(email, password));

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteMe_WithBusinessHistory_ShouldAnonymizeAccount_AndInvalidateFurtherRequests()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Company Self Delete History");

        const string email = "member-history@test.com";
        const string password = "MemberPassword123!";

        var accountId = await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            "Member History",
            "Member",
            password);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Receptions.Add(new Reception
            {
                Id = Guid.NewGuid(),
                CompanyId = company.Id,
                ReceptionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Status = "Draft",
                AccountId = accountId,
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        await AccountsAuthTestHelper.AuthenticateAsync(_client, email, password);

        var deleteResponse = await _client.DeleteAsync("/api/accounts/me");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId);
            Assert.NotNull(account);
            Assert.False(account!.IsActive);
            Assert.NotNull(account.DeletedAt);
            Assert.Equal(Account.DeletedDisplayName, account.DisplayName);
        }

        var protectedResponse = await _client.GetAsync("/api/inventories");
        Assert.Equal(HttpStatusCode.Unauthorized, protectedResponse.StatusCode);
    }
}
