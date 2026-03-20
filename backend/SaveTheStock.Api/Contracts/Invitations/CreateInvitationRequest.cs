namespace SaveTheStock.Api.Contracts.Invitations;

public sealed record CreateInvitationRequest(
    string DisplayName,
    string Email,
    string Role
);
