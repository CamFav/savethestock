namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a reception (incoming shipment) within a company.
/// </summary>
public class Reception
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public DateOnly ReceptionDate { get; set; }

    public string? Reference { get; set; }

    public bool HasIssue { get; set; }
    public string? IssueNote { get; set; }

    public string Status { get; set; } = "Draft";

    public Guid AccountId { get; set; }
    public Account? Account { get; set; }

    public Guid? SupplierId { get; set; }
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
