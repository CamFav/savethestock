namespace SaveTheStock.Application.Authentication.Login;

/// <summary>
/// Represents the input data required for the login use case
/// </summary>
public sealed record LoginInput(
    string Email,
    string Password
);
