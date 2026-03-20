using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using SaveTheStock.Api.Contracts.Companies;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Security;
using SaveTheStock.Application.Companies.Delete;

namespace SaveTheStock.Api.Controllers;

/// <summary>
/// Provides HTTP endpoints for managing companies.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUser _currentUser;
    private readonly DeleteCompanyUseCase _deleteCompany;

    public CompaniesController(
        AppDbContext dbContext,
        ICurrentUser currentUser,
        DeleteCompanyUseCase deleteCompany)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _deleteCompany = deleteCompany;
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
    /// [GET] Company enumeration is disabled.
    /// </summary>
    [Authorize]
    [HttpGet]
    public ActionResult<List<CompanyResponse>> GetCompanies()
    {
        return Forbid();
    }


    /// <summary>
    /// [GET] Retrieves a company by its ID.
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CompanyResponse>> GetCompanyById(Guid id, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            return Unauthorized();

        if (id != companyId.Value)
            return NotFound();

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
    [Authorize]
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
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CompanyResponse>> UpdateCompany(
        Guid id,
        [FromBody] UpdateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            return Unauthorized();

        if (id != companyId.Value)
            return NotFound();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Company name is required.");

        var company = await _dbContext.Companies.FindAsync(new object[] { id }, cancellationToken);

        if (company is null)
            return NotFound();

        company.Name = request.Name.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapToResponse(company));
    }

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpDelete("/api/company")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteCompany(CancellationToken cancellationToken)
    {
        try
        {
            await _deleteCompany.ExecuteAsync(cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }
}
