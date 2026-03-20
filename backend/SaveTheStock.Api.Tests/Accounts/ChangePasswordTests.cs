using System.Net;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Accounts;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Accounts;

/// <summary>
/// Tests for the password change endpoint.
/// </summary>
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

        await AccountsAuthTestHelper.AuthenticateAsync(_client, ownerEmail, tempPassword);

        var response = await _client.PostAsJsonAsync(
            "/api/accounts/me/change-password",
            new ChangeMyPasswordRequest(tempPassword, newPassword, newPassword));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        _client.DefaultRequestHeaders.Authorization = null;

        var loginResponse = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(ownerEmail, newPassword));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var payload = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload!.JwtToken));
    }

    [Fact]
    public async Task ChangePassword_ShouldRejectInvalidCurrentPassword()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string email = "owner-invalid-current@test.com";
        const string currentPassword = "CurrentPassword123!";
        const string wrongPassword = "WrongPassword123!";
        const string newPassword = "NewPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            "Owner",
            "Owner",
            currentPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, email, currentPassword);

        var response = await _client.PostAsJsonAsync(
            "/api/accounts/me/change-password",
            new ChangeMyPasswordRequest(wrongPassword, newPassword, newPassword));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("mot de passe actuel est incorrect", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ChangePassword_ShouldRejectMismatchedConfirmation()
    {
        var company = await AccountsAuthTestHelper.CreateCompanyAsync(_client, "Test Company");
        const string email = "owner-confirm@test.com";
        const string currentPassword = "CurrentPassword123!";
        const string newPassword = "NewPassword123!";

        await AccountsAuthTestHelper.SeedAccountAsync(
            _factory,
            company.Id,
            email,
            "Owner",
            "Owner",
            currentPassword);

        await AccountsAuthTestHelper.AuthenticateAsync(_client, email, currentPassword);

        var response = await _client.PostAsJsonAsync(
            "/api/accounts/me/change-password",
            new ChangeMyPasswordRequest(currentPassword, newPassword, "DifferentPassword123!"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("confirmation", content, StringComparison.OrdinalIgnoreCase);
    }
}
