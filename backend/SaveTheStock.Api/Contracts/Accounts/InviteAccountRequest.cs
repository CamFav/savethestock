using System.ComponentModel.DataAnnotations;

namespace SaveTheStock.Api.Contracts.Accounts;

/// <summary>
/// Request payload for inviting a new account to the current company.
/// </summary>
public sealed record InviteAccountRequest(
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    string Email,

    [Required]
    [MaxLength(100)]
    string DisplayName
);
