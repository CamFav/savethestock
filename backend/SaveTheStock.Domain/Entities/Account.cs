namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a user account belonging to a company.
/// An account can have different roles (Owner or Member) and is used for authentication,
/// authorization, and tracking actions performed in the system.
/// This entity belongs to the Domain layer and models core business data.
/// </summary>
public class Account
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;

    // role "Owner"/"Member"
    public string Role { get; set; } = "Member";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}
