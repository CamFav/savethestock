using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Receptions;

public sealed class GetReceptionsPagedTests
{
    [Fact]
    public async Task GetReceptionsPaged_AsOwner_Returns200_WithItems()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        CompanyResponse company = await AccountsAuthTestHelper.CreateCompanyAsync(client, "TestCo");

        await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            company.Id,
            email: "owner@test.com",
            displayName: "Owner",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(client, "owner@test.com", "Password123!");

        var r1 = await client.PostAsJsonAsync(
            "/api/receptions",
            new CreateReceptionRequest(
                ReceptionDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
                Reference: "REC-001",
                HasIssue: false,
                IssueNote: null,
                SupplierId: null));
        Assert.Equal(HttpStatusCode.Created, r1.StatusCode);

        var r2 = await client.PostAsJsonAsync(
            "/api/receptions",
            new CreateReceptionRequest(
                ReceptionDate: DateOnly.FromDateTime(DateTime.UtcNow),
                Reference: "REC-002",
                HasIssue: true,
                IssueNote: "Damaged box",
                SupplierId: null));
        Assert.Equal(HttpStatusCode.Created, r2.StatusCode);

        // Act
        var resp = await client.GetAsync("/api/receptions?page=1&pageSize=10");

        // Assert
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<PagedReceptionsResponse>();
        Assert.NotNull(body);

        Assert.True(body!.Total >= 2);
        Assert.True(body.Items.Count >= 2);
    }
}