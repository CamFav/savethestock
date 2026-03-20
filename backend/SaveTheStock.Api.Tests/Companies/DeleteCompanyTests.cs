using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Contracts.Invitations;
using SaveTheStock.Api.Tests.Testing;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using Xunit;

namespace SaveTheStock.Api.Tests.Companies;

public sealed class DeleteCompanyTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public DeleteCompanyTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DeleteCompany_ShouldRemoveTenantDataAndInvalidateOwnerSession()
    {
        const string ownerEmail = "owner-company-delete@test.com";
        const string ownerPassword = "OwnerPassword123!";

        var registerResponse = await _client.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterRequest("Delete Company", "Owner Company", ownerEmail, ownerPassword));

        var auth = await registerResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(auth);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth!.JwtToken);

        await _client.PostAsJsonAsync(
            "/api/invitations",
            new CreateInvitationRequest("Member Invited", "delete-company-member@test.com", "MEMBER"));

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Categories.Add(new Category
            {
                Id = Guid.NewGuid(),
                CompanyId = auth.CompanyId,
                Name = "Epicerie",
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var deleteResponse = await _client.DeleteAsync("/api/company");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.Companies.AnyAsync(c => c.Id == auth.CompanyId));
            Assert.False(await db.Accounts.AnyAsync(a => a.CompanyId == auth.CompanyId));
            Assert.False(await db.Invitations.AnyAsync(i => i.CompanyId == auth.CompanyId));
            Assert.False(await db.Categories.IgnoreQueryFilters().AnyAsync(c => c.CompanyId == auth.CompanyId));
        }

        var protectedResponse = await _client.GetAsync($"/api/companies/{auth.CompanyId}");
        Assert.Equal(HttpStatusCode.Unauthorized, protectedResponse.StatusCode);
    }
}
