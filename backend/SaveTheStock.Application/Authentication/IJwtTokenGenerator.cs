namespace SaveTheStock.Application.Authentication;

/// <summary>
/// Defines the contract for a service responsible for generating JWT tokens for authenticated users.
/// Implementations of this interface will create JWT tokens containing claims such as account ID, company ID
/// </summary>
public interface IJwtTokenGenerator
{
    (string Token, DateTimeOffset ExpiresAt) GenerateToken(
        Guid accountId,
        Guid companyId,
        string role);
}