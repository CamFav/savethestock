namespace SaveTheStock.Application.Authentication.Register;

public sealed record RegisterResult(
    string JwtToken,
    Guid AccountId,
    Guid CompanyId,
    string CompanyName,
    string Role,
    string DisplayName
);
