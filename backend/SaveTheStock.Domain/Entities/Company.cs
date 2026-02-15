namespace SaveTheStock.Domain.Entities;

/// <summary>
/// Represents a company in the system.
/// </summary>
public class Company
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public ICollection<Account> Accounts { get; set; } = new List<Account>();
}