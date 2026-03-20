namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a waste session.
/// </summary>
public class WasteSession
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid AccountId { get; set; }
    public DateOnly WasteDate { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PostedAt { get; set; }
    public Guid? PostedByAccountId { get; set; }

    public ICollection<WasteLine> Lines { get; set; } = new List<WasteLine>();
}

public class WasteLine
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid WasteSessionId { get; set; }
    public Guid LotId { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = null!;

    public WasteSession? WasteSession { get; set; }
    public Lot? Lot { get; set; }
}
