using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Inventories;
using SaveTheStock.Api.Contracts.Lots;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Inventories;

public sealed class InventoryFlowTests
{
    [Fact]
    public async Task PostInventory_ComputesTheoretical_AndUpdatesLots()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "InvCoA", "inv-owner-a@test.com");
        var product = await CreateProductAsync(client, "RICE-INV-A");
        var lot = await CreateLotAsync(client, product.Id, 10m, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)));

        var inventory = await CreateInventoryAsync(client);

        var upsertResp = await client.PostAsJsonAsync(
            $"/api/inventories/{inventory.Id}/lines",
            new UpsertInventoryLineRequest(product.Id, 7m));
        Assert.Equal(HttpStatusCode.Created, upsertResp.StatusCode);

        var postResp = await client.PostAsync($"/api/inventories/{inventory.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postResp.StatusCode);

        var getInventory = await client.GetAsync($"/api/inventories/{inventory.Id}");
        Assert.Equal(HttpStatusCode.OK, getInventory.StatusCode);

        var postedInventory = await getInventory.Content.ReadFromJsonAsync<InventoryResponse>();
        Assert.NotNull(postedInventory);
        Assert.Single(postedInventory!.Lines);
        Assert.Equal(10m, postedInventory.Lines[0].TheoreticalQuantity);
        Assert.Equal(7m, postedInventory.Lines[0].RealQuantity);

        var lotResp = await client.GetAsync($"/api/lots/{lot.Id}");
        Assert.Equal(HttpStatusCode.OK, lotResp.StatusCode);
        var lotAfter = await lotResp.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(lotAfter);
        Assert.Equal(7m, lotAfter!.QuantityRemaining);
    }

    [Fact]
    public async Task PostInventory_DeltaNegative_UsesFefo()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "InvCoB", "inv-owner-b@test.com");
        var product = await CreateProductAsync(client, "RICE-INV-B");

        var olderExpiry = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));
        var newerExpiry = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));

        var lot1 = await CreateLotAsync(client, product.Id, 4m, olderExpiry);
        var lot2 = await CreateLotAsync(client, product.Id, 6m, newerExpiry);

        var inventory = await CreateInventoryAsync(client);
        var upsertResp = await client.PostAsJsonAsync(
            $"/api/inventories/{inventory.Id}/lines",
            new UpsertInventoryLineRequest(product.Id, 7m));
        Assert.Equal(HttpStatusCode.Created, upsertResp.StatusCode);

        var postResp = await client.PostAsync($"/api/inventories/{inventory.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postResp.StatusCode);

        var lot1After = await (await client.GetAsync($"/api/lots/{lot1.Id}")).Content.ReadFromJsonAsync<LotResponse>();
        var lot2After = await (await client.GetAsync($"/api/lots/{lot2.Id}")).Content.ReadFromJsonAsync<LotResponse>();

        Assert.NotNull(lot1After);
        Assert.NotNull(lot2After);

        Assert.Equal(1m, lot1After!.QuantityRemaining);
        Assert.Equal(6m, lot2After!.QuantityRemaining);
    }

    [Fact]
    public async Task PostInventory_DeltaPositive_CreditsMostRecentLot()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "InvCoC", "inv-owner-c@test.com");
        var product = await CreateProductAsync(client, "RICE-INV-C");

        var lot1 = await CreateLotAsync(client, product.Id, 2m, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)));
        var lot2 = await CreateLotAsync(client, product.Id, 3m, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20)));

        var inventory = await CreateInventoryAsync(client);
        var upsertResp = await client.PostAsJsonAsync(
            $"/api/inventories/{inventory.Id}/lines",
            new UpsertInventoryLineRequest(product.Id, 8m));
        Assert.Equal(HttpStatusCode.Created, upsertResp.StatusCode);

        var postResp = await client.PostAsync($"/api/inventories/{inventory.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postResp.StatusCode);

        var lot1After = await (await client.GetAsync($"/api/lots/{lot1.Id}")).Content.ReadFromJsonAsync<LotResponse>();
        var lot2After = await (await client.GetAsync($"/api/lots/{lot2.Id}")).Content.ReadFromJsonAsync<LotResponse>();

        Assert.NotNull(lot1After);
        Assert.NotNull(lot2After);

        Assert.Equal(2m, lot1After!.QuantityRemaining);
        Assert.Equal(6m, lot2After!.QuantityRemaining);
    }

    [Fact]
    public async Task PostInventory_Twice_ReturnsConflict()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "InvCoD", "inv-owner-d@test.com");
        var product = await CreateProductAsync(client, "RICE-INV-D");
        await CreateLotAsync(client, product.Id, 3m, null);

        var inventory = await CreateInventoryAsync(client);
        var upsertResp = await client.PostAsJsonAsync(
            $"/api/inventories/{inventory.Id}/lines",
            new UpsertInventoryLineRequest(product.Id, 2m));
        Assert.Equal(HttpStatusCode.Created, upsertResp.StatusCode);

        var first = await client.PostAsync($"/api/inventories/{inventory.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);

        var second = await client.PostAsync($"/api/inventories/{inventory.Id}/post", null);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task PostInventory_CrossTenant_ReturnsNotFound()
    {
        await using var factory = new SaveTheStockApiFactory();

        var clientA = factory.CreateClient();
        await CreateAndAuthenticateOwnerAsync(factory, clientA, "InvTenantA", "inv-owner-ta@test.com");
        var productA = await CreateProductAsync(clientA, "RICE-INV-TA");
        await CreateLotAsync(clientA, productA.Id, 4m, null);

        var inventoryA = await CreateInventoryAsync(clientA);
        var upsertResp = await clientA.PostAsJsonAsync(
            $"/api/inventories/{inventoryA.Id}/lines",
            new UpsertInventoryLineRequest(productA.Id, 1m));
        Assert.Equal(HttpStatusCode.Created, upsertResp.StatusCode);

        var clientB = factory.CreateClient();
        await CreateAndAuthenticateOwnerAsync(factory, clientB, "InvTenantB", "inv-owner-tb@test.com");

        var crossPost = await clientB.PostAsync($"/api/inventories/{inventoryA.Id}/post", null);
        Assert.Equal(HttpStatusCode.NotFound, crossPost.StatusCode);
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

    private static async Task<ProductResponse> CreateProductAsync(HttpClient client, string productName)
    {
        var categoryResp = await client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest($"CAT-{Guid.NewGuid():N}"[..12]));
        Assert.Equal(HttpStatusCode.Created, categoryResp.StatusCode);

        var category = await categoryResp.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(category);

        var productResp = await client.PostAsJsonAsync(
            "/api/products",
            new CreateProductRequest(category!.Id, productName, "KG", 0, true));
        Assert.Equal(HttpStatusCode.Created, productResp.StatusCode);

        var product = await productResp.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(product);

        return product!;
    }

    private static async Task<LotResponse> CreateLotAsync(HttpClient client, Guid productId, decimal qty, DateOnly? expiryDate)
    {
        var response = await client.PostAsJsonAsync(
            "/api/lots",
            new CreateLotRequest(
                ProductId: productId,
                ReceptionId: null,
                LotCode: $"LOT-{Guid.NewGuid():N}"[..14],
                ExpiryDate: expiryDate,
                UnitCost: 0m,
                QuantityInitial: qty));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var lot = await response.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(lot);

        return lot!;
    }

    private static async Task<InventoryResponse> CreateInventoryAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/inventories",
            new CreateInventoryRequest(DateOnly.FromDateTime(DateTime.UtcNow), "Weekly inventory"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var inventory = await response.Content.ReadFromJsonAsync<InventoryResponse>();
        Assert.NotNull(inventory);

        return inventory!;
    }
}
