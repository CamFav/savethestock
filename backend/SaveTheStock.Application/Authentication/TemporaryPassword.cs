namespace SaveTheStock.Application.Authentication;

/// <summary>
/// Constants and utilities for temporary password handling.
/// </summary>
public static class TemporaryPassword
{
    /// <summary>
    /// Prefix used to mark a password hash as temporary.
    /// Temporary passwords must be changed on first login.
    /// </summary>
    public const string Prefix = "TEMP:";

    /// <summary>
    /// Extracts the actual password hash from a temporary password hash.
    /// If the hash has the temporary prefix, it is removed; otherwise the hash is returned as-is.
    /// </summary>
    /// <param name="passwordHash">The password hash that may have a temporary prefix.</param>
    /// <returns>The actual password hash without the prefix.</returns>
    public static string ExtractIfTemporary(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            return passwordHash;

        if (passwordHash.StartsWith(Prefix, StringComparison.Ordinal))
            return passwordHash[Prefix.Length..];

        return passwordHash;
    }

    /// <summary>
    /// Checks if a password hash is marked as temporary.
    /// </summary>
    /// <param name="passwordHash">The password hash to check.</param>
    /// <returns>True if the hash has the temporary prefix; otherwise false.</returns>
    public static bool IsTemporary(string? passwordHash)
    {
        return !string.IsNullOrWhiteSpace(passwordHash) &&
               passwordHash.StartsWith(Prefix, StringComparison.Ordinal);
    }
}
