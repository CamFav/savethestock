namespace SaveTheStock.Api.Contracts.Invitations;

public sealed record InvitationTokenResponse(
    Guid Id,
    string CompanyName,
    string Email,
    string DisplayName,
    string Role,
    string Status,
    DateTime ExpiresAt
);
