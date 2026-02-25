using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Tests.Testing;
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
    public async Task DeleteMe_ShouldAnonymizeAndSoftDeleteAccount_AndBlockLogin()
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
            Assert.NotNull(account);

            Assert.False(account!.IsActive);
            Assert.NotNull(account.DeletedAt);

            Assert.Equal("Deleted User", account.DisplayName);
            Assert.Equal($"deleted-{accountId}@example.invalid", account.Email);
        }

        // Assert (login blocked)
        var loginResponse = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(email, password));

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }
}