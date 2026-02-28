namespace SaveTheStock.Application.Common.Utilities;

/// <summary>
/// Utility for normalizing names.
/// </summary>
public static class NameNormalizer
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var trimmed = value.Trim();

        var parts = trimmed
            .Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var collapsed = string.Join(" ", parts);

        return collapsed.ToUpperInvariant();
    }
}