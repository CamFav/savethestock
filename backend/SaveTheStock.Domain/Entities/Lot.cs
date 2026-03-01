namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a stock lot within a company. A lot may be unassigned to a reception.
/// </summary>
public class Lot
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid? ReceptionId { get; set; }

    public string? LotCode { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public decimal UnitCost { get; set; }

    public decimal QuantityInitial { get; set; }

    public decimal QuantityRemaining { get; set; }

    public bool HasIssue { get; set; }

    public string? IssueNote { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}