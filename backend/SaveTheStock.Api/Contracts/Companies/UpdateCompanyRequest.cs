namespace SaveTheStock.Api.Contracts.Companies;

/// <summary>
/// Request payload used to update a company.
/// </summary>
public sealed class UpdateCompanyRequest
{
    public string Name { get; set; } = string.Empty;
}