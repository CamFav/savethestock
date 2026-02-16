namespace SaveTheStock.Api.Contracts.Companies;

/// <summary>
/// Request payload used to create a company.
/// </summary>
public sealed class CreateCompanyRequest
{
    public string Name { get; set; } = string.Empty;
}