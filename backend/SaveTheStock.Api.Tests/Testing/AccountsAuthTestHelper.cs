using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using Xunit;

namespace SaveTheStock.Api.Tests.Testing;

internal static class AccountsAuthTestHelper
{
    public static async Task<CompanyResponse> CreateCompanyAsync(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/companies", new CreateCompanyRequest { Name = name });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var company = await response.Content.ReadFromJsonAsync<CompanyResponse>();
        Assert.NotNull(company);

        return company!;
    }

    public static async Task<Guid> SeedAccountAsync(
        SaveTheStockApiFactory factory,
        Guid companyId,
        string email,
        string displayName,
        string role,
        string password,
        bool isActive = true,
        DateTime? deletedAt = null,
        bool useTemporaryPassword = false)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var accountId = Guid.NewGuid();
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var account = new Account
        {
            Id = accountId,
            CompanyId = companyId,
            Email = normalizedEmail,
            DisplayName = displayName,
            Role = role,
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = deletedAt
        };

        var hasher = new PasswordHasher<Account>();
        var hashedPassword = hasher.HashPassword(account, password);
        account.PasswordHash = useTemporaryPassword
            ? $"TEMP:{hashedPassword}"
            : hashedPassword;

        dbContext.Accounts.Add(account);
        await dbContext.SaveChangesAsync();

        return accountId;
    }

    public static async Task<LoginResponse> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(payload);

        return payload!;
    }

    public static async Task<LoginResponse> AuthenticateAsync(HttpClient client, string email, string password)
    {
        var payload = await LoginAsync(client, email, password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload.AccessToken);
        return payload;
    }
}
