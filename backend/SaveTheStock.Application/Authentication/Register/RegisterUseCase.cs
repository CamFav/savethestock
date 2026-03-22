using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Authentication.Register;

public sealed class RegisterUseCase
{
    private readonly IAppDbContext _db;
    private readonly IPasswordService _passwords;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RegisterUseCase(
        IAppDbContext db,
        IPasswordService passwords,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _db = db;
        _passwords = passwords;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<RegisterResult> ExecuteAsync(RegisterInput input, CancellationToken cancellationToken)
    {
        var companyName = input.CompanyName?.Trim();
        var displayName = input.OwnerDisplayName?.Trim();
        var normalizedEmail = EmailNormalizer.Normalize(input.OwnerEmail);
        var password = input.Password;

        if (string.IsNullOrWhiteSpace(companyName))
            throw new InvalidOperationException("Company name is required.");

        if (string.IsNullOrWhiteSpace(displayName))
            throw new InvalidOperationException("Display name is required.");

        if (string.IsNullOrWhiteSpace(normalizedEmail))
            throw new InvalidOperationException("Email is required.");

        if (string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("Password is required.");

        var emailAlreadyUsed = await _db.AccountEmailExistsAsync(normalizedEmail, cancellationToken);
        if (emailAlreadyUsed)
            throw new InvalidOperationException("An account with this email already exists.");

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = companyName,
            CreatedAt = DateTime.UtcNow
        };

        var ownerAccount = new Account
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Email = normalizedEmail,
            DisplayName = displayName,
            Role = "Owner",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        ownerAccount.PasswordHash = _passwords.HashPassword(ownerAccount, password);

        _db.AddCompany(company);
        _db.AddAccount(ownerAccount);
        await _db.SaveChangesAsync(cancellationToken);

        var (token, _) = _jwtTokenGenerator.GenerateToken(ownerAccount.Id, company.Id, ownerAccount.Role);

        return new RegisterResult(
            token,
            ownerAccount.Id,
            company.Id,
            company.Name,
            ownerAccount.Role,
            ownerAccount.DisplayName);
    }
}
