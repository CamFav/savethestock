namespace SaveTheStock.Application.Authentication.Register;

public sealed record RegisterInput(
    string CompanyName,
    string OwnerDisplayName,
    string OwnerEmail,
    string Password
);
