using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Receptions;

public sealed class DeleteReceptionTests
{
    [Fact]
    public async Task DeleteReception_IsIdempotent_AndGetReturns404()
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

        // Create reception
        var createResp = await client.PostAsJsonAsync(
            "/api/receptions",
            new CreateReceptionRequest(
                ReceptionDate: DateOnly.FromDateTime(DateTime.UtcNow),
                Reference: "REC-DEL",
                HasIssue: false,
                IssueNote: null,
                SupplierId: null));

        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var created = await createResp.Content.ReadFromJsonAsync<ReceptionResponse>();
        Assert.NotNull(created);

        // Delete (204)
        var del1 = await client.DeleteAsync($"/api/receptions/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del1.StatusCode);

        // Delete again (204)
        var del2 = await client.DeleteAsync($"/api/receptions/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del2.StatusCode);

        // get = 404
        var get = await client.GetAsync($"/api/receptions/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }
}