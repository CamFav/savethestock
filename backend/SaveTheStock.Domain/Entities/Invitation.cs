namespace SaveTheStock.Domain.Entities;

public static class InvitationStatuses
{
    public const string Pending = "PENDING";
    public const string Accepted = "ACCEPTED";
    public const string Expired = "EXPIRED";
    public const string Revoked = "REVOKED";
}

public class Invitation
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = "Member";
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = InvitationStatuses.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public Guid CreatedByAccountId { get; set; }
    public DateTime? RevokedAt { get; set; }

    public Company? Company { get; set; }
    public Account? CreatedByAccount { get; set; }
}
