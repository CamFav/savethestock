using System.ComponentModel.DataAnnotations;

namespace SaveTheStock.Api.Contracts.Accounts;

/// <summary>
/// Request payload for changing the authenticated user's password.
/// </summary>
public sealed record ChangeMyPasswordRequest(
    [Required]
    [MinLength(8)]
    [MaxLength(255)]
    string NewPassword
);
