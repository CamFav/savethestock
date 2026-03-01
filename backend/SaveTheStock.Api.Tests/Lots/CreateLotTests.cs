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