using System.ComponentModel.DataAnnotations;

namespace SaveTheStock.Api.Contracts.Auth;

public sealed record RegisterRequest(
    [Required]
    [MaxLength(100)]
    string CompanyName,

    [Required]
    [MaxLength(100)]
    string OwnerDisplayName,

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    string OwnerEmail,

    [Required]
    [MinLength(8)]
    [MaxLength(255)]
    string Password
);
