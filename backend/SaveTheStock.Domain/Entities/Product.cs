namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a product within a company.
/// </summary>
public class Product
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public int AlertThreshold { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}