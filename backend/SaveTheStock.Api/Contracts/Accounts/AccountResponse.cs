namespace SaveTheStock.Api.Contracts.Accounts;

/// <summary>
/// Represents an account payload returned by account-related endpoints.
/// </summary>
public sealed record AccountResponse(
    Guid Id,
    Guid CompanyId,
    string Email,
    string DisplayName,
    string Role,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? DeletedAt,
    bool MustChangePassword
);
