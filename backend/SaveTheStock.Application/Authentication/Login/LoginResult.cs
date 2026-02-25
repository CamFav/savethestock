namespace SaveTheStock.Application.Authentication.Login;

/// <summary>
/// Represents the result of a successful login attempt
/// </summary>
public sealed record LoginResult(
    string JwtToken,
    Guid AccountId,
    Guid CompanyId,
    string Role,
    string DisplayName
);
