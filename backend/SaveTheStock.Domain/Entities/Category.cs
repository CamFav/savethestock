namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a product category within a company.
/// </summary>
public class Category
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}