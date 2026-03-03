namespace SaveTheStock.Api.Options;

public sealed class DevelopmentSeedOptions
{
    public bool Enabled { get; set; }
    public string CompanyName { get; set; } = "Dev Company";
    public string OwnerDisplayName { get; set; } = "Dev Owner";
    public string OwnerEmail { get; set; } = "owner@dev.local";
    public string OwnerPassword { get; set; } = "DevPassword123!";
}
