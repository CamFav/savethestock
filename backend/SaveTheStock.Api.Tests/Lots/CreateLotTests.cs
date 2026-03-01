using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Contracts.Lots;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Lots;

public sealed class CreateLotTests
{
    [Fact]
    public async Task CreateLot_AsOwner_Returns201()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(client, "TestCo");

        var ownerAccountId = await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            company.Id,
            email: "owner@test.com",
            displayName: "Owner",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(client, "owner@test.com", "Password123!");

        // Create category
        var categoryResp = await client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("FOOD"));

        Assert.Equal(HttpStatusCode.Created, categoryResp.StatusCode);
        var category = await categoryResp.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(category);

        // Create product
        var productResp = await client.PostAsJsonAsync(
            "/api/products",
            new CreateProductRequest(category!.Id, "RICE", "KG", 0, true));

        Assert.Equal(HttpStatusCode.Created, productResp.StatusCode);
        var product = await productResp.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(product);

        // Create lot
        var lotResp = await client.PostAsJsonAsync(
            "/api/lots",
            new CreateLotRequest(
                ProductId: product!.Id,
                ReceptionId: null,
                LotCode: "LOT-001",
                ExpiryDate: null,
                UnitCost: 0m,
                QuantityInitial: 10m));

        Assert.Equal(HttpStatusCode.Created, lotResp.StatusCode);

        var lot = await lotResp.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(lot);

        Assert.Equal(10m, lot!.QuantityRemaining);

        // Update lot
        var putResp = await client.PutAsJsonAsync(
            $"/api/lots/{lot.Id}",
            new UpdateLotRequest(
                ReceptionId: null,
                LotCode: "LOT-UPDATED",
                ExpiryDate: null,
                UnitCost: 12.5m,
                HasIssue: true,
                IssueNote: "Packaging damaged"));

        Assert.Equal(HttpStatusCode.NoContent, putResp.StatusCode);

        var getAfterUpdate = await client.GetAsync($"/api/lots/{lot.Id}");
        Assert.Equal(HttpStatusCode.OK, getAfterUpdate.StatusCode);

        var updated = await getAfterUpdate.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(updated);
        Assert.Equal("LOT-UPDATED", updated!.LotCode);
        Assert.Equal(12.5m, updated.UnitCost);
        Assert.True(updated.HasIssue);
        Assert.Equal("Packaging damaged", updated.IssueNote);

        

        // Delete lot
        var deleteResp = await client.DeleteAsync($"/api/lots/{lot!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        var deleteResp2 = await client.DeleteAsync($"/api/lots/{lot.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp2.StatusCode);

        // 404
        var getResp = await client.GetAsync($"/api/lots/{lot.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }

    [Fact]
    public async Task CreateLot_AsMember_Returns403()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        var company = await AccountsAuthTestHelper.CreateCompanyAsync(client, "TestCo");

        var memberAccountId = await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            company.Id,
            email: "member@test.com",
            displayName: "Member",
            role: "Member",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(
            client,
            "member@test.com",
            "Password123!");

        var response = await client.PostAsJsonAsync(
            "/api/lots",
            new CreateLotRequest(
                ProductId: Guid.NewGuid(),
                ReceptionId: null,
                LotCode: null,
                ExpiryDate: null,
                UnitCost: 0m,
                QuantityInitial: 10m));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}