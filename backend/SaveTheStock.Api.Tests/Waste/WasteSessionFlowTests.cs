using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Lots;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Contracts.WasteSessions;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Waste;

public sealed class WasteSessionFlowTests
{
    [Fact]
    public async Task PostWasteSession_DecrementsLotQuantity()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        var company = await CreateAndAuthenticateOwnerAsync(factory, client, "WasteCoA", "owner-a@test.com");
        var lot = await CreateLotAsync(client, "RICE", 10m);

        var session = await CreateWasteSessionAsync(client, DateOnly.FromDateTime(DateTime.UtcNow), "Broken package");

        var addLineResp = await client.PostAsJsonAsync(
            $"/api/waste-sessions/{session.Id}/lines",
            new AddWasteLineRequest(lot.Id, 3m, "Damaged"));

        Assert.Equal(HttpStatusCode.Created, addLineResp.StatusCode);

        var postResp = await client.PostAsync($"/api/waste-sessions/{session.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postResp.StatusCode);

        var lotAfterResp = await client.GetAsync($"/api/lots/{lot.Id}");
        Assert.Equal(HttpStatusCode.OK, lotAfterResp.StatusCode);

        var lotAfter = await lotAfterResp.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(lotAfter);
        Assert.Equal(7m, lotAfter!.QuantityRemaining);
    }

    [Fact]
    public async Task PostWasteSession_WithTooLargeQuantity_FailsAndDoesNotModifyLot()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        var company = await CreateAndAuthenticateOwnerAsync(factory, client, "WasteCoB", "owner-b@test.com");
        var lot = await CreateLotAsync(client, "PASTA", 5m);

        var session = await CreateWasteSessionAsync(client, DateOnly.FromDateTime(DateTime.UtcNow), null);

        var addLineResp = await client.PostAsJsonAsync(
            $"/api/waste-sessions/{session.Id}/lines",
            new AddWasteLineRequest(lot.Id, 8m, "Loss"));

        Assert.Equal(HttpStatusCode.Created, addLineResp.StatusCode);

        var postResp = await client.PostAsync($"/api/waste-sessions/{session.Id}/post", null);
        Assert.Equal(HttpStatusCode.BadRequest, postResp.StatusCode);

        var lotAfterResp = await client.GetAsync($"/api/lots/{lot.Id}");
        Assert.Equal(HttpStatusCode.OK, lotAfterResp.StatusCode);

        var lotAfter = await lotAfterResp.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(lotAfter);
        Assert.Equal(5m, lotAfter!.QuantityRemaining);
    }

    [Fact]
    public async Task PostWasteSession_Twice_ReturnsConflict()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        var company = await CreateAndAuthenticateOwnerAsync(factory, client, "WasteCoC", "owner-c@test.com");
        var lot = await CreateLotAsync(client, "FLOUR", 9m);

        var session = await CreateWasteSessionAsync(client, DateOnly.FromDateTime(DateTime.UtcNow), null);

        var addLineResp = await client.PostAsJsonAsync(
            $"/api/waste-sessions/{session.Id}/lines",
            new AddWasteLineRequest(lot.Id, 2m, "Damaged"));

        Assert.Equal(HttpStatusCode.Created, addLineResp.StatusCode);

        var firstPost = await client.PostAsync($"/api/waste-sessions/{session.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, firstPost.StatusCode);

        var secondPost = await client.PostAsync($"/api/waste-sessions/{session.Id}/post", null);
        Assert.Equal(HttpStatusCode.Conflict, secondPost.StatusCode);
    }

    [Fact]
    public async Task PostWasteSession_CrossTenant_ReturnsNotFound()
    {
        await using var factory = new SaveTheStockApiFactory();

        var clientA = factory.CreateClient();
        await CreateAndAuthenticateOwnerAsync(factory, clientA, "WasteTenantA", "owner-tenant-a@test.com");
        var lotA = await CreateLotAsync(clientA, "MILK", 4m);
        var sessionA = await CreateWasteSessionAsync(clientA, DateOnly.FromDateTime(DateTime.UtcNow), null);

        var addLineResp = await clientA.PostAsJsonAsync(
            $"/api/waste-sessions/{sessionA.Id}/lines",
            new AddWasteLineRequest(lotA.Id, 1m, "Damaged"));
        Assert.Equal(HttpStatusCode.Created, addLineResp.StatusCode);

        var clientB = factory.CreateClient();
        await CreateAndAuthenticateOwnerAsync(factory, clientB, "WasteTenantB", "owner-tenant-b@test.com");

        var crossTenantPost = await clientB.PostAsync($"/api/waste-sessions/{sessionA.Id}/post", null);
        Assert.Equal(HttpStatusCode.NotFound, crossTenantPost.StatusCode);
    }

    private static async Task<CompanyResponse> CreateAndAuthenticateOwnerAsync(
        SaveTheStockApiFactory factory,
        HttpClient client,
        string companyName,
        string ownerEmail)
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(client, companyName);

        await AccountsAuthTestHelper.SeedAccountAsync(
            factory,
            company.Id,
            email: ownerEmail,
            displayName: "Owner",
            role: "Owner",
            password: "Password123!");

        await AccountsAuthTestHelper.AuthenticateAsync(client, ownerEmail, "Password123!");

        return company;
    }

    private static async Task<LotResponse> CreateLotAsync(HttpClient client, string productName, decimal quantityInitial)
    {
        var categoryResp = await client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest("FOOD"));

        Assert.Equal(HttpStatusCode.Created, categoryResp.StatusCode);

        var category = await categoryResp.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(category);

        var productResp = await client.PostAsJsonAsync(
            "/api/products",
            new CreateProductRequest(category!.Id, productName, "KG", 0, true));

        Assert.Equal(HttpStatusCode.Created, productResp.StatusCode);

        var product = await productResp.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(product);

        var lotResp = await client.PostAsJsonAsync(
            "/api/lots",
            new CreateLotRequest(
                ProductId: product!.Id,
                ReceptionId: null,
                LotCode: $"LOT-{Guid.NewGuid():N}"[..12],
                ExpiryDate: null,
                UnitCost: 0m,
                QuantityInitial: quantityInitial));

        Assert.Equal(HttpStatusCode.Created, lotResp.StatusCode);

        var lot = await lotResp.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(lot);

        return lot!;
    }

    private static async Task<WasteSessionResponse> CreateWasteSessionAsync(HttpClient client, DateOnly wasteDate, string? comment)
    {
        var createResp = await client.PostAsJsonAsync(
            "/api/waste-sessions",
            new CreateWasteSessionRequest(wasteDate, comment));

        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var session = await createResp.Content.ReadFromJsonAsync<WasteSessionResponse>();
        Assert.NotNull(session);

        return session!;
    }
}
