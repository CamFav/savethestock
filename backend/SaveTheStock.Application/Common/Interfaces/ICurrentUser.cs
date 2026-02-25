namespace SaveTheStock.Application.Common.Interfaces;

/// <summary>
/// Represents the current authenticated user in the application. This interface provides properties to access
/// the user's authentication status, account ID, company ID, and role.
/// </summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? AccountId { get; }
    Guid? CompanyId { get; }
    string? Role { get; }
}