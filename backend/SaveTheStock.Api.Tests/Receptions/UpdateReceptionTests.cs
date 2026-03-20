using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Receptions;

public sealed class UpdateReceptionTests
{
    [Fact]
    public async Task UpdateReception_AsOwner_Returns204_AndGetShowsChanges()
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

        // Create
        var createResp = await client.PostAsJsonAsync(
            "/api/receptions",
            new CreateReceptionRequest(
                ReceptionDate: DateOnly.FromDateTime(DateTime.UtcNow),
                Reference: "REC-001",
                HasIssue: false,
                IssueNote: null,
                SupplierId: null));

        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var created = await createResp.Content.ReadFromJsonAsync<ReceptionResponse>();
        Assert.NotNull(created);

        // Update
        var putResp = await client.PutAsJsonAsync(
            $"/api/receptions/{created!.Id}",
            new UpdateReceptionRequest(
                ReceptionDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)),
                Reference: "REC-UPDATED",
                HasIssue: true,
                IssueNote: "Missing items",
                SupplierId: null));

        Assert.Equal(HttpStatusCode.NoContent, putResp.StatusCode);

        // Verify
        var getResp = await client.GetAsync($"/api/receptions/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        var updated = await getResp.Content.ReadFromJsonAsync<ReceptionResponse>();
        Assert.NotNull(updated);

        Assert.Equal("REC-UPDATED", updated!.Reference);
        Assert.True(updated.HasIssue);
        Assert.Equal("Missing items", updated.IssueNote);
    }
}