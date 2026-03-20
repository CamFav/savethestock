namespace SaveTheStock.Api.Contracts.Invitations;

public sealed record AcceptInvitationRequest(
    string Mode,
    string Password
);
