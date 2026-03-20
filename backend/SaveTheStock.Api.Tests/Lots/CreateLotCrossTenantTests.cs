using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Contracts.Lots;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Lots;

public sealed class CreateLotCrossTenantTests
{
    [Fact]
    public async Task CreateLot_WithProductFromOtherTenant_Returns404()
    {
        await using var factory = new SaveTheStockApiFactory();

        // Tenant A
        var clientA = factory.CreateClient();
        var companyA = await AccountsAuthTestHelper.CreateCompanyAsync(clientA, "TenantA");

        var ownerA = await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            companyA.Id,
            email: "ownerA@test.com",
            displayName: "OwnerA",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(
            clientA,
            "ownerA@test.com",
            "Password123!");

        var categoryResp = await clientA.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("FOOD"));

        var category = await categoryResp.Content.ReadFromJsonAsync<CategoryResponse>();

        var productResp = await clientA.PostAsJsonAsync(
            "/api/products",
            new CreateProductRequest(category!.Id, "RICE", "KG", 0, true));

        var product = await productResp.Content.ReadFromJsonAsync<ProductResponse>();

        var createdLotResp = await clientA.PostAsJsonAsync(
            "/api/lots",
            new CreateLotRequest(
                ProductId: product!.Id,
                ReceptionId: null,
                LotCode: "LOT-A",
                ExpiryDate: null,
                UnitCost: 0m,
                QuantityInitial: 1m));

        Assert.Equal(HttpStatusCode.Created, createdLotResp.StatusCode);

        var createdLot = await createdLotResp.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(createdLot);

        // Tenant B
        var clientB = factory.CreateClient();
        var companyB = await AccountsAuthTestHelper.CreateCompanyAsync(clientB, "TenantB");

        var ownerB = await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            companyB.Id,
            email: "ownerB@test.com",
            displayName: "OwnerB",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(
            clientB,
            "ownerB@test.com",
            "Password123!");

        var lotResp = await clientB.PostAsJsonAsync(
            "/api/lots",
            new CreateLotRequest(
                ProductId: product!.Id,
                ReceptionId: null,
                LotCode: null,
                ExpiryDate: null,
                UnitCost: 0m,
                QuantityInitial: 1m));

        Assert.Equal(HttpStatusCode.NotFound, lotResp.StatusCode);

        var getResp = await clientB.GetAsync($"/api/lots/{createdLot!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }
}