namespace SaveTheStock.Application.Authentication;

public interface IJwtTokenGenerator
{
    (string Token, DateTimeOffset ExpiresAt) GenerateToken(
        Guid accountId,
        Guid companyId,
        string role);
}