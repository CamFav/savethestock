using System.Net;
using System.Net.Http.Json;
using Xunit;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Api.Contracts.Suppliers;
using SaveTheStock.Api.Tests.Testing;

namespace SaveTheStock.Api.Tests.Suppliers;

public sealed class CreateSupplierTests
{
    [Fact]
    public async Task CreateSupplier_AsOwner_Returns201()
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

        var resp = await client.PostAsJsonAsync(
            "/api/suppliers",
            new CreateSupplierRequest("Fresh Foods"));

        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<SupplierResponse>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body!.Id);
    }

    [Fact]
    public async Task CreateSupplier_DuplicateName_Returns409()
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

        var resp1 = await client.PostAsJsonAsync(
            "/api/suppliers",
            new CreateSupplierRequest("  Fresh   Foods "));

        Assert.Equal(HttpStatusCode.Created, resp1.StatusCode);

        var resp2 = await client.PostAsJsonAsync(
            "/api/suppliers",
            new CreateSupplierRequest("fresh foods"));

        Assert.Equal(HttpStatusCode.Conflict, resp2.StatusCode);
    }
}