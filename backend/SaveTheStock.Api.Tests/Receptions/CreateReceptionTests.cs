using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Receptions;

public sealed class CreateReceptionTests
{
    [Fact]
    public async Task CreateReception_AsOwner_Returns201_WithDraftStatus()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        CompanyResponse company = await AccountsAuthTestHelper.CreateCompanyAsync(client, "TestCo");

        var ownerAccountId = await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            company.Id,
            email: "owner@test.com",
            displayName: "Owner",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(client, "owner@test.com", "Password123!");

        // Act
        var resp = await client.PostAsJsonAsync(
            "/api/receptions",
            new CreateReceptionRequest(
                ReceptionDate: DateOnly.FromDateTime(DateTime.UtcNow),
                Reference: "REC-001",
                HasIssue: false,
                IssueNote: null,
                SupplierId: null));

        // Assert
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<ReceptionResponse>();
        Assert.NotNull(body);

        Assert.Equal(company.Id, body!.CompanyId);
        Assert.Equal("Draft", body.Status);
        Assert.Equal(ownerAccountId, body.AccountId);
        Assert.Equal("REC-001", body.Reference);
        Assert.Null(body.SupplierId);
    }
}