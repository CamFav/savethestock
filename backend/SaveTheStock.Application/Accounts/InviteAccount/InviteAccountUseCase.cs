using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Application.Authentication;
using SaveTheStock.Domain.Entities;
using System.Security.Cryptography;

namespace SaveTheStock.Application.Accounts.InviteAccount;

public sealed class InviteAccountUseCase
{
    private readonly IAppDbContext _db;
    private readonly IPasswordService _passwords;
    private readonly ICurrentUser _currentUser;

    public InviteAccountUseCase(
        IAppDbContext db,
        IPasswordService passwords,
        ICurrentUser currentUser)
    {
        _db = db;
        _passwords = passwords;
        _currentUser = currentUser;
    }

    public async Task<Account> ExecuteAsync(InviteAccountCommand command, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException("Missing company_id claim.");

        var normalizedEmail = EmailNormalizer.Normalize(command.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
            throw new InvalidOperationException("Email is required.");

        var emailAlreadyUsed = await _db.AccountEmailExistsAsync(normalizedEmail, cancellationToken);
        if (emailAlreadyUsed)
            throw new InvalidOperationException("An account with this email already exists.");

        var temporaryPassword = GenerateTemporaryPassword(24);

        var account = new Account
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId.Value,
            Email = normalizedEmail,
            DisplayName = command.DisplayName.Trim(),
            Role = "Member",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        var hashed = _passwords.HashPassword(account, temporaryPassword);
        account.PasswordHash = TemporaryPassword.Prefix + hashed;

        _db.AddAccount(account);
        await _db.SaveChangesAsync(cancellationToken);

        return account;
    }

    private static string GenerateTemporaryPassword(int length)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_";
        var buffer = new byte[length];

        RandomNumberGenerator.Fill(buffer);

        var result = new char[length];
        for (var i = 0; i < length; i++)
            result[i] = chars[buffer[i] % chars.Length];

        return new string(result);
    }
}