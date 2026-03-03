namespace SaveTheStock.Application.Authentication.Register;

public sealed record RegisterResult(
    string JwtToken,
    Guid AccountId,
    Guid CompanyId,
    string Role,
    string DisplayName
);
