namespace SaveTheStock.Application.Common.Utilities;

/// <summary>
/// Utility for normalizing email addresses.
/// </summary>
public static class EmailNormalizer
{
    /// <summary>
    /// Normalizes an email address by trimming whitespace and converting to lowercase.
    /// </summary>
    /// <param name="email">The email to normalize.</param>
    /// <returns>The normalized email, or null if input is null or whitespace.</returns>
    public static string? Normalize(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        return email.Trim().ToLowerInvariant();
    }
}
