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

    /// <summary>
    /// [GET] Retrieves all companies.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<Company>>> GetCompanies()
    {
        var companies = await _dbContext.Companies.ToListAsync();

        return Ok(companies);
    }

    /// <summary>
    /// [GET] Retrieves a company by its ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Company>> GetCompanyById(Guid id)
    {
        var company = await _dbContext.Companies.FindAsync(id);

        if (company is null)
            return NotFound();

        return Ok(company);
    }

    
    /// <summary>
    /// [POST] Creates a new company.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Company>> CreateCompany([FromBody] CreateCompanyRequest request)
    {
        // note : moove to app layer later
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Company name is required.");

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Companies.Add(company);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCompanyById), new { id = company.Id }, company);
    }

    /// <summary>
    /// [PUT] Updates an existing company.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Company>> UpdateCompany(Guid id, [FromBody] UpdateCompanyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Company name is required.");

        var company = await _dbContext.Companies.FindAsync(id);

        if (company is null)
            return NotFound();

        company.Name = request.Name.Trim();

        await _dbContext.SaveChangesAsync();

        return Ok(company);
    }
}
