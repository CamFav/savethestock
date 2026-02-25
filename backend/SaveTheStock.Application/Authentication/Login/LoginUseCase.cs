using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;

namespace SaveTheStock.Application.Authentication.Login;

/// <summary>
/// Use case for handling user login and JWT token generation.
/// </summary>
public sealed class LoginUseCase
{
    private readonly IAppDbContext _db;
    private readonly IPasswordService _passwords;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginUseCase(
        IAppDbContext db,
        IPasswordService passwords,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _db = db;
        _passwords = passwords;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResult> ExecuteAsync(LoginInput input, CancellationToken cancellationToken)
    {
        var normalizedEmail = EmailNormalizer.Normalize(input.Email);
        var password = input.Password;

        if (string.IsNullOrWhiteSpace(normalizedEmail) ||
            string.IsNullOrWhiteSpace(password))
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        var account = await _db.FindActiveAccountByNormalizedEmailAsync(normalizedEmail, cancellationToken);

        if (account is null)
            throw new UnauthorizedAccessException("Invalid credentials.");

        var storedPasswordHash = account.PasswordHash;
        if (string.IsNullOrWhiteSpace(storedPasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        storedPasswordHash = TemporaryPassword.ExtractIfTemporary(storedPasswordHash);

        if (string.IsNullOrWhiteSpace(storedPasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        var passwordValid = _passwords.VerifyPassword(account, storedPasswordHash, password);
        if (!passwordValid)
            throw new UnauthorizedAccessException("Invalid credentials.");

        var role = account.Role.ToString();
        var (token, _) = _jwtTokenGenerator.GenerateToken(account.Id, account.CompanyId, role);

        return new LoginResult(
            token,
            account.Id,
            account.CompanyId,
            role,
            account.DisplayName);
    }
}
