using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

public sealed class ChangePasswordTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;
    private readonly SaveTheStockApiFactory _factory;

    public ChangePasswordTests(SaveTheStockApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ChangePassword_ShouldRemoveTempPrefix()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string ownerEmail = "owner-change-password@test.com";
        const string tempPassword = "TempPassword123!";
        const string newPassword = "NewSecurePassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            ownerEmail,
            "Owner",
            "Owner",
            tempPassword,
            useTemporaryPassword: true);

        var initialLogin = await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, tempPassword);
        Assert.True(initialLogin.MustChangePassword);

        var response = await _client.PutAsJsonAsync(
            "/api/accounts/me/password",
            new ChangeMyPasswordRequest(newPassword));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        _client.DefaultRequestHeaders.Authorization = null;

        var loginResponse = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(ownerEmail, newPassword));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var payload = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(payload);
        Assert.False(payload!.MustChangePassword);
    }
}
