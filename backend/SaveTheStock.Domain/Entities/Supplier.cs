namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a supplier within a company.
/// </summary>
public class Supplier
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}