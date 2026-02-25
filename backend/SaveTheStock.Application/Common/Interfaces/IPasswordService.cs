using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Common.Interfaces;

/// <summary>
/// Interface for password hashing and verification services.
/// </summary>
public interface IPasswordService
{
    string HashPassword(Account account, string password);
    bool VerifyPassword(Account account, string hashedPassword, string providedPassword);
}
