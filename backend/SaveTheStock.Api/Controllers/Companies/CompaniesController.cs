using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using SaveTheStock.Api.Contracts.Companies;

namespace SaveTheStock.Api.Controllers;

/// <summary>
/// Provides HTTP endpoints for managing companies.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CompaniesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private static CompanyResponse MapToResponse(Company company)
    {
        return new CompanyResponse
        {
            Id = company.Id,
            Name = company.Name,
            CreatedAt = company.CreatedAt
        };
    }

    /// <summary>
    /// [GET] Retrieves all companies.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CompanyResponse>>> GetCompanies(CancellationToken cancellationToken)
    {
        var companies = await _dbContext.Companies
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var response = companies.Select(MapToResponse).ToList();

        return Ok(response);
    }


    /// <summary>
    /// [GET] Retrieves a company by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CompanyResponse>> GetCompanyById(Guid id, CancellationToken cancellationToken)
    {
        var company = await _dbContext.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (company is null)
            return NotFound();

        return Ok(MapToResponse(company));
    }



    
    /// <summary>
    /// [POST] Creates a new company.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CompanyResponse>> CreateCompany(
        [FromBody] CreateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Company name is required.");

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Companies.Add(company);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetCompanyById), new { id = company.Id }, MapToResponse(company));
    }

    /// <summary>
    /// [PUT] Updates an existing company.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CompanyResponse>> UpdateCompany(
        Guid id,
        [FromBody] UpdateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Company name is required.");

        var company = await _dbContext.Companies.FindAsync(new object[] { id }, cancellationToken);

        if (company is null)
            return NotFound();

        company.Name = request.Name.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapToResponse(company));
    }
}
