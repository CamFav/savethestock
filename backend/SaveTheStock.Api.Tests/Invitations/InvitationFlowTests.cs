using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Api.Contracts.Invitations;
using SaveTheStock.Api.Tests.Testing;
using Xunit;

namespace SaveTheStock.Api.Tests.Invitations;

public sealed class InvitationFlowTests : IClassFixture<SaveTheStockApiFactory>
{
    private readonly HttpClient _client;

    public InvitationFlowTests(SaveTheStockApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateAndList_ShouldExposePendingInvitationWithLink()
    {
        await AuthenticateOwnerAsync("owner-create@test.local", "Password123!");

        var createResponse = await _client.PostAsJsonAsync(
            "/api/invitations",
            new CreateInvitationRequest("Sophie Martin", "sophie@test.local", "MEMBER"));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<InvitationResponse>();
        Assert.NotNull(created);
        Assert.Equal("PENDING", created!.Status);
        Assert.StartsWith("/invite/", created.InvitationPath);

        var listResponse = await _client.GetAsync("/api/invitations");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var invitations = await listResponse.Content.ReadFromJsonAsync<List<InvitationResponse>>();
        Assert.NotNull(invitations);
        Assert.Single(invitations!);
        Assert.Equal("sophie@test.local", invitations[0].Email);
    }

    [Fact]
    public async Task Accept_WithRegisterMode_ShouldCreateAccountAndMarkInvitationAccepted()
    {
        await AuthenticateOwnerAsync("owner-accept@test.local", "Password123!");

        var createResponse = await _client.PostAsJsonAsync(
            "/api/invitations",
            new CreateInvitationRequest("Nina Leroy", "nina@test.local", "MEMBER"));

        var created = await createResponse.Content.ReadFromJsonAsync<InvitationResponse>();
        Assert.NotNull(created);

        _client.DefaultRequestHeaders.Authorization = null;
        var token = created.InvitationPath["/invite/".Length..];

        var tokenResponse = await _client.GetAsync($"/api/invitations/token/{token}");
        Assert.Equal(HttpStatusCode.OK, tokenResponse.StatusCode);

        var tokenPayload = await tokenResponse.Content.ReadFromJsonAsync<InvitationTokenResponse>();
        Assert.NotNull(tokenPayload);
        Assert.Equal("PENDING", tokenPayload!.Status);
        Assert.Equal("nina@test.local", tokenPayload.Email);

        var acceptResponse = await _client.PostAsJsonAsync(
            $"/api/invitations/token/{token}/accept",
            new AcceptInvitationRequest("REGISTER", "Password123!"));

        Assert.Equal(HttpStatusCode.OK, acceptResponse.StatusCode);

        var auth = await acceptResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth!.JwtToken));
        Assert.Equal("Nina Leroy", auth.DisplayName);

        var acceptedTokenResponse = await _client.GetAsync($"/api/invitations/token/{token}");
        var acceptedToken = await acceptedTokenResponse.Content.ReadFromJsonAsync<InvitationTokenResponse>();
        Assert.NotNull(acceptedToken);
        Assert.Equal("ACCEPTED", acceptedToken!.Status);
    }

    [Fact]
    public async Task Revoke_ShouldPreventAcceptance()
    {
        await AuthenticateOwnerAsync("owner-revoke@test.local", "Password123!");

        var createResponse = await _client.PostAsJsonAsync(
            "/api/invitations",
            new CreateInvitationRequest("Lucas Petit", "lucas@test.local", "MEMBER"));

        var created = await createResponse.Content.ReadFromJsonAsync<InvitationResponse>();
        Assert.NotNull(created);
        var token = created!.InvitationPath["/invite/".Length..];

        var revokeResponse = await _client.PostAsync($"/api/invitations/{created.Id}/revoke", null);
        Assert.Equal(HttpStatusCode.NoContent, revokeResponse.StatusCode);

        _client.DefaultRequestHeaders.Authorization = null;

        var acceptResponse = await _client.PostAsJsonAsync(
            $"/api/invitations/token/{token}/accept",
            new AcceptInvitationRequest("REGISTER", "Password123!"));

        Assert.Equal(HttpStatusCode.BadRequest, acceptResponse.StatusCode);
    }

    private async Task AuthenticateOwnerAsync(string email, string password)
    {
        var registerResponse = await _client.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterRequest("Company Test", "Owner Test", email, password));

        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var payload = await registerResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(payload);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload!.JwtToken);
    }
}
