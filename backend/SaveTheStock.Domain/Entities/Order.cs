namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a purchase order within a company.
/// </summary>
public class Order
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Reference { get; set; } = string.Empty;
    public DateOnly OrderDate { get; set; }
    public Guid? SupplierId { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? Notes { get; set; }
    public Guid AccountId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Supplier? Supplier { get; set; }
    public Account? Account { get; set; }
    public ICollection<OrderLine> Lines { get; set; } = new List<OrderLine>();
    public ICollection<Reception> Receptions { get; set; } = new List<Reception>();
}

public class OrderLine
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal QuantityOrdered { get; set; }
    public decimal QuantityReceived { get; set; }
    public decimal? UnitPrice { get; set; }

    public Order? Order { get; set; }
    public Product? Product { get; set; }
}
