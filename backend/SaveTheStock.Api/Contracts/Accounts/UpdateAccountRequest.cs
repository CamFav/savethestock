using System.ComponentModel.DataAnnotations;

namespace SaveTheStock.Api.Contracts.Accounts;

/// <summary>
/// Request payload updating an existing account.
/// </summary>
public sealed record UpdateAccountRequest(
    [EmailAddress]
    [MaxLength(255)]
    string? Email,

    [MaxLength(100)]
    string? DisplayName,

    bool? IsActive
);
