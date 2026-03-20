namespace SaveTheStock.Api.Contracts.Invitations;

public sealed record InvitationResponse(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    string Email,
    string DisplayName,
    string Role,
    string Status,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    DateTime? AcceptedAt,
    Guid CreatedByAccountId,
    DateTime? RevokedAt,
    string InvitationPath
);
