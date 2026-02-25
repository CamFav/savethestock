using Microsoft.AspNetCore.Identity;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Authentication;

public sealed class PasswordService : IPasswordService
{
    private readonly IPasswordHasher<Account> _hasher;

    public PasswordService(IPasswordHasher<Account> hasher)
    {
        _hasher = hasher;
    }

    public string HashPassword(Account account, string password)
        => _hasher.HashPassword(account, password);

    public bool VerifyPassword(Account account, string hashedPassword, string providedPassword)
        => _hasher.VerifyHashedPassword(account, hashedPassword, providedPassword) != PasswordVerificationResult.Failed;
}
