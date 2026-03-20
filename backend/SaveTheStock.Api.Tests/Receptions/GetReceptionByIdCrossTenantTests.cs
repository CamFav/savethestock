using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Receptions;

public sealed class GetReceptionByIdCrossTenantTests
{
    [Fact]
    public async Task GetReceptionById_FromOtherTenant_Returns404()
    {
        await using var factory = new SaveTheStockApiFactory();

        // Tenant A
        var clientA = factory.CreateClient();
        CompanyResponse companyA = await AccountsAuthTestHelper.CreateCompanyAsync(clientA, "TenantA");

        await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            companyA.Id,
            email: "ownerA@test.com",
            displayName: "OwnerA",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(clientA, "ownerA@test.com", "Password123!");

        var createResp = await clientA.PostAsJsonAsync(
            "/api/receptions",
            new CreateReceptionRequest(
                ReceptionDate: DateOnly.FromDateTime(DateTime.UtcNow),
                Reference: "REC-A",
                HasIssue: false,
                IssueNote: null,
                SupplierId: null));

        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var created = await createResp.Content.ReadFromJsonAsync<ReceptionResponse>();
        Assert.NotNull(created);

        // Tenant B
        var clientB = factory.CreateClient();
        CompanyResponse companyB = await AccountsAuthTestHelper.CreateCompanyAsync(clientB, "TenantB");

        await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            companyB.Id,
            email: "ownerB@test.com",
            displayName: "OwnerB",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(clientB, "ownerB@test.com", "Password123!");

        // Act
        var getResp = await clientB.GetAsync($"/api/receptions/{created!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }
}