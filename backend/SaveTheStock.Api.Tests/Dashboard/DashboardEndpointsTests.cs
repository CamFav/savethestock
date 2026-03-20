using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Dashboard;
using SaveTheStock.Api.Contracts.Inventories;
using SaveTheStock.Api.Contracts.Lots;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Api.Contracts.WasteSessions;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Dashboard;

public sealed class DashboardEndpointsTests
{
    [Fact]
    public async Task Summary_Trend_AndTopWasteProducts_ReturnExpectedValues()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "DashCoA", "dash-owner-a@test.com");
        var today = DateOnly.FromDateTime(DateTime.Today);
        var from = today.AddDays(-2);

        var product = await CreateProductAsync(client, "DASH-RICE", alertThreshold: 2);
        var reception = await CreateReceptionAsync(client, today.AddDays(-1));
        var lot = await CreateLotAsync(client, product.Id, reception.Id, qty: 10m, unitCost: 2m, expiryDate: today.AddDays(10));

        var wasteSession = await CreateWasteSessionAsync(client, today, "Broken package");
        var addWasteLine = await client.PostAsJsonAsync(
            $"/api/waste-sessions/{wasteSession.Id}/lines",
            new AddWasteLineRequest(lot.Id, 2m, "Damaged"));
        Assert.Equal(HttpStatusCode.Created, addWasteLine.StatusCode);
        var postWaste = await client.PostAsync($"/api/waste-sessions/{wasteSession.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postWaste.StatusCode);

        var inventory = await CreateInventoryAsync(client, today);
        var addInventoryLine = await client.PostAsJsonAsync(
            $"/api/inventories/{inventory.Id}/lines",
            new UpsertInventoryLineRequest(product.Id, 7m));
        Assert.Equal(HttpStatusCode.Created, addInventoryLine.StatusCode);
        var postInventory = await client.PostAsync($"/api/inventories/{inventory.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postInventory.StatusCode);

        var summaryResponse = await client.GetAsync($"/api/dashboard/summary?from={from:yyyy-MM-dd}&to={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, summaryResponse.StatusCode);
        var summary = await summaryResponse.Content.ReadFromJsonAsync<DashboardSummaryResponse>();
        Assert.NotNull(summary);
        Assert.Equal(14m, summary!.StockUsableValue);
        Assert.Equal(0m, summary.StockExpiredValue);
        Assert.Equal(14m, summary!.StockTotalValue);
        Assert.Equal(4m, summary.WasteValue);
        Assert.Equal(2m, summary.WasteQty);
        Assert.Equal(20m, summary.ReceptionsValue);
        Assert.Equal(0.2m, summary.WasteRate);
        Assert.Equal(2m, summary.InventoryVarianceValue);

        var trendResponse = await client.GetAsync("/api/dashboard/waste-trend?days=30");
        Assert.Equal(HttpStatusCode.OK, trendResponse.StatusCode);
        var trend = await trendResponse.Content.ReadFromJsonAsync<IReadOnlyList<WasteTrendPointResponse>>();
        Assert.NotNull(trend);
        Assert.Contains(trend!, x => x.Date == today && x.WasteQty == 2m && x.WasteValue == 4m);

        var topResponse = await client.GetAsync($"/api/dashboard/top-waste-products?from={from:yyyy-MM-dd}&to={today:yyyy-MM-dd}&limit=5");
        Assert.Equal(HttpStatusCode.OK, topResponse.StatusCode);
        var top = await topResponse.Content.ReadFromJsonAsync<IReadOnlyList<TopWasteProductResponse>>();
        Assert.NotNull(top);
        Assert.Contains(top!, x =>
            x.ProductId == product.Id &&
            x.TotalWasteQty == 2m &&
            x.TotalWasteValue == 4m);
    }

    [Fact]
    public async Task Alerts_ReturnLowStock_Expiring_AndExpiredLots()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "DashCoB", "dash-owner-b@test.com");
        var today = DateOnly.FromDateTime(DateTime.Today);

        var lowStockProduct = await CreateProductAsync(client, "LOW-STOCK", alertThreshold: 5);
        var expiringProduct = await CreateProductAsync(client, "EXPIRING", alertThreshold: 0);
        var expiredProduct = await CreateProductAsync(client, "EXPIRED", alertThreshold: 0);

        await CreateLotAsync(client, lowStockProduct.Id, receptionId: null, qty: 3m, unitCost: 1m, expiryDate: null);
        var expiringLot = await CreateLotAsync(client, expiringProduct.Id, receptionId: null, qty: 2m, unitCost: 1m, expiryDate: today.AddDays(2));
        var expiredLot = await CreateLotAsync(client, expiredProduct.Id, receptionId: null, qty: 1m, unitCost: 1m, expiryDate: today.AddDays(-1));

        var response = await client.GetAsync("/api/dashboard/alerts?expiryDays=3");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var alerts = await response.Content.ReadFromJsonAsync<DashboardAlertsResponse>();
        Assert.NotNull(alerts);

        Assert.Contains(alerts!.LowStockProducts, x => x.ProductId == lowStockProduct.Id && x.QuantityRemaining == 3m);
        Assert.Contains(alerts.ExpiringLots, x => x.LotId == expiringLot.Id);
        Assert.Contains(alerts.ExpiredLots, x => x.LotId == expiredLot.Id);
        Assert.Equal(1m, alerts.ExpiredStockValue);

        Assert.DoesNotContain(alerts.ExpiringLots, x => x.LotId == expiredLot.Id);
        Assert.DoesNotContain(alerts.ExpiredLots, x => x.LotId == expiringLot.Id);
    }

    [Fact]
    public async Task WasteTrend_GroupsValuesByWasteDate()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "DashCoTrend", "dash-trend-owner@test.com");
        var today = DateOnly.FromDateTime(DateTime.Today);
        var yesterday = today.AddDays(-1);

        var product = await CreateProductAsync(client, "TREND-PRODUCT", alertThreshold: 0);
        var lot = await CreateLotAsync(client, product.Id, receptionId: null, qty: 20m, unitCost: 3m, expiryDate: null);

        var wasteYesterday = await CreateWasteSessionAsync(client, yesterday, "Day -1");
        var addYesterday = await client.PostAsJsonAsync(
            $"/api/waste-sessions/{wasteYesterday.Id}/lines",
            new AddWasteLineRequest(lot.Id, 2m, "Damaged"));
        Assert.Equal(HttpStatusCode.Created, addYesterday.StatusCode);
        var postYesterday = await client.PostAsync($"/api/waste-sessions/{wasteYesterday.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postYesterday.StatusCode);

        var wasteToday = await CreateWasteSessionAsync(client, today, "Day 0");
        var addToday = await client.PostAsJsonAsync(
            $"/api/waste-sessions/{wasteToday.Id}/lines",
            new AddWasteLineRequest(lot.Id, 1m, "Expired"));
        Assert.Equal(HttpStatusCode.Created, addToday.StatusCode);
        var postToday = await client.PostAsync($"/api/waste-sessions/{wasteToday.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postToday.StatusCode);

        var trendResp = await client.GetAsync("/api/dashboard/waste-trend?days=7");
        Assert.Equal(HttpStatusCode.OK, trendResp.StatusCode);

        var trend = await trendResp.Content.ReadFromJsonAsync<IReadOnlyList<WasteTrendPointResponse>>();
        Assert.NotNull(trend);
        Assert.Contains(trend!, x => x.Date == yesterday && x.WasteQty == 2m && x.WasteValue == 6m);
        Assert.Contains(trend!, x => x.Date == today && x.WasteQty == 1m && x.WasteValue == 3m);
    }

    [Fact]
    public async Task InventoryDeltaNegative_UpdatesVarianceInDashboardSummary()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "DashCoVariance", "dash-variance-owner@test.com");
        var today = DateOnly.FromDateTime(DateTime.Today);
        var from = today.AddDays(-1);

        var product = await CreateProductAsync(client, "INV-VARIANCE", alertThreshold: 0);
        await CreateLotAsync(client, product.Id, receptionId: null, qty: 10m, unitCost: 4m, expiryDate: null);

        var inventory = await CreateInventoryAsync(client, today);
        var addLine = await client.PostAsJsonAsync(
            $"/api/inventories/{inventory.Id}/lines",
            new UpsertInventoryLineRequest(product.Id, 7m));
        Assert.Equal(HttpStatusCode.Created, addLine.StatusCode);

        var postInventory = await client.PostAsync($"/api/inventories/{inventory.Id}/post", null);
        Assert.Equal(HttpStatusCode.NoContent, postInventory.StatusCode);

        var summaryResp = await client.GetAsync($"/api/dashboard/summary?from={from:yyyy-MM-dd}&to={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, summaryResp.StatusCode);
        var summary = await summaryResp.Content.ReadFromJsonAsync<DashboardSummaryResponse>();
        Assert.NotNull(summary);

        // |real - theoretical| = |7 - 10| = 3; unit_cost proxy = 4 => variance = 12
        Assert.Equal(12m, summary!.InventoryVarianceValue);
    }

    [Fact]
    public async Task ExpiredLot_IsExcludedFromUsableStock_AndLowStockUsesUsableQuantity()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "DashCoUsableExpired", "dash-usable-expired@test.com");
        var today = DateOnly.FromDateTime(DateTime.Today);

        var product = await CreateProductAsync(client, "Cerises", alertThreshold: 10);
        await CreateLotAsync(client, product.Id, receptionId: null, qty: 1m, unitCost: 5m, expiryDate: today.AddDays(-1));

        var summaryResp = await client.GetAsync($"/api/dashboard/summary?from={today.AddDays(-1):yyyy-MM-dd}&to={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, summaryResp.StatusCode);

        var summaryJson = await summaryResp.Content.ReadAsStringAsync();
        using var summaryDocument = JsonDocument.Parse(summaryJson);
        Assert.True(summaryDocument.RootElement.TryGetProperty("stockExpiredValue", out var stockExpiredJson));
        Assert.Equal(5m, stockExpiredJson.GetDecimal());

        var summary = JsonSerializer.Deserialize<DashboardSummaryResponse>(
            summaryJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.NotNull(summary);
        Assert.Equal(0m, summary!.StockUsableValue);
        Assert.Equal(5m, summary.StockExpiredValue);
        Assert.Equal(5m, summary.StockTotalValue);

        var alertsResp = await client.GetAsync("/api/dashboard/alerts?expiryDays=3");
        Assert.Equal(HttpStatusCode.OK, alertsResp.StatusCode);
        var alerts = await alertsResp.Content.ReadFromJsonAsync<DashboardAlertsResponse>();
        Assert.NotNull(alerts);
        Assert.Contains(alerts!.LowStockProducts, x =>
            x.ProductId == product.Id &&
            x.QuantityRemaining == 0m &&
            x.AlertThreshold == 10);
    }

    [Fact]
    public async Task NonExpiredLot_IsCountedAsUsableStock_AndLowStockUsesThatQuantity()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "DashCoUsableFresh", "dash-usable-fresh@test.com");
        var today = DateOnly.FromDateTime(DateTime.Today);

        var product = await CreateProductAsync(client, "Cerises", alertThreshold: 10);
        await CreateLotAsync(client, product.Id, receptionId: null, qty: 1m, unitCost: 5m, expiryDate: today.AddDays(2));

        var summaryResp = await client.GetAsync($"/api/dashboard/summary?from={today.AddDays(-1):yyyy-MM-dd}&to={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, summaryResp.StatusCode);
        var summary = await summaryResp.Content.ReadFromJsonAsync<DashboardSummaryResponse>();
        Assert.NotNull(summary);
        Assert.Equal(5m, summary!.StockUsableValue);
        Assert.Equal(0m, summary.StockExpiredValue);
        Assert.Equal(5m, summary.StockTotalValue);

        var alertsResp = await client.GetAsync("/api/dashboard/alerts?expiryDays=3");
        Assert.Equal(HttpStatusCode.OK, alertsResp.StatusCode);
        var alerts = await alertsResp.Content.ReadFromJsonAsync<DashboardAlertsResponse>();
        Assert.NotNull(alerts);
        Assert.Contains(alerts!.LowStockProducts, x =>
            x.ProductId == product.Id &&
            x.QuantityRemaining == 1m &&
            x.AlertThreshold == 10);
    }

    [Fact]
    public async Task ExpiryToday_IsStillUsable_AndNotExpired()
    {
        await using var factory = new SaveTheStockApiFactory();
        var client = factory.CreateClient();

        await CreateAndAuthenticateOwnerAsync(factory, client, "DashCoBoundaryToday", "dash-boundary-today@test.com");
        var today = DateOnly.FromDateTime(DateTime.Today);

        var product = await CreateProductAsync(client, "Boundary-Product", alertThreshold: 10);
        await CreateLotAsync(client, product.Id, receptionId: null, qty: 1m, unitCost: 5m, expiryDate: today);

        var summaryResp = await client.GetAsync($"/api/dashboard/summary?from={today.AddDays(-1):yyyy-MM-dd}&to={today:yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, summaryResp.StatusCode);
        var summary = await summaryResp.Content.ReadFromJsonAsync<DashboardSummaryResponse>();
        Assert.NotNull(summary);

        Assert.Equal(5m, summary!.StockUsableValue);
        Assert.Equal(0m, summary.StockExpiredValue);
        Assert.Equal(5m, summary.StockTotalValue);
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

    private static async Task<ProductResponse> CreateProductAsync(HttpClient client, string productName, int alertThreshold)
    {
        var categoryResp = await client.PostAsJsonAsync(
            "/api/categories",
            new CreateCategoryRequest($"CAT-{Guid.NewGuid():N}"[..10]));
        Assert.Equal(HttpStatusCode.Created, categoryResp.StatusCode);

        var category = await categoryResp.Content.ReadFromJsonAsync<CategoryResponse>();
        Assert.NotNull(category);

        var productResp = await client.PostAsJsonAsync(
            "/api/products",
            new CreateProductRequest(category!.Id, productName, "KG", alertThreshold, true));
        Assert.Equal(HttpStatusCode.Created, productResp.StatusCode);

        var product = await productResp.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(product);
        return product!;
    }

    private static async Task<ReceptionResponse> CreateReceptionAsync(HttpClient client, DateOnly date)
    {
        var response = await client.PostAsJsonAsync(
            "/api/receptions",
            new CreateReceptionRequest(date, "RCPT-1", false, null, null));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var reception = await response.Content.ReadFromJsonAsync<ReceptionResponse>();
        Assert.NotNull(reception);
        return reception!;
    }

    private static async Task<LotResponse> CreateLotAsync(
        HttpClient client,
        Guid productId,
        Guid? receptionId,
        decimal qty,
        decimal unitCost,
        DateOnly? expiryDate)
    {
        var response = await client.PostAsJsonAsync(
            "/api/lots",
            new CreateLotRequest(
                ProductId: productId,
                ReceptionId: receptionId,
                LotCode: $"LOT-{Guid.NewGuid():N}"[..14],
                ExpiryDate: expiryDate,
                UnitCost: unitCost,
                QuantityInitial: qty));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var lot = await response.Content.ReadFromJsonAsync<LotResponse>();
        Assert.NotNull(lot);
        return lot!;
    }

    private static async Task<WasteSessionResponse> CreateWasteSessionAsync(HttpClient client, DateOnly wasteDate, string? comment)
    {
        var response = await client.PostAsJsonAsync(
            "/api/waste-sessions",
            new CreateWasteSessionRequest(wasteDate, comment));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var waste = await response.Content.ReadFromJsonAsync<WasteSessionResponse>();
        Assert.NotNull(waste);
        return waste!;
    }

    private static async Task<InventoryResponse> CreateInventoryAsync(HttpClient client, DateOnly inventoryDate)
    {
        var response = await client.PostAsJsonAsync(
            "/api/inventories",
            new CreateInventoryRequest(inventoryDate, "dash inventory"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var inventory = await response.Content.ReadFromJsonAsync<InventoryResponse>();
        Assert.NotNull(inventory);
        return inventory!;
    }
}
