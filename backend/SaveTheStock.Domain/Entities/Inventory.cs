namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents an inventory session.
/// </summary>
public class Inventory
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid AccountId { get; set; }
    public DateOnly InventoryDate { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<InventoryLine> Lines { get; set; } = new List<InventoryLine>();
}

public class InventoryLine
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid InventoryId { get; set; }
    public Guid ProductId { get; set; }
    public decimal TheoreticalQuantity { get; set; }
    public decimal RealQuantity { get; set; }

    public Inventory? Inventory { get; set; }
    public Product? Product { get; set; }
}

