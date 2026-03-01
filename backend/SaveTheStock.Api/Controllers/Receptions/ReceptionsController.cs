using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Application.Catalog.Receptions.Create;
using SaveTheStock.Application.Catalog.Receptions.GetById;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Controllers;

/// <summary>
/// Provides HTTP endpoints for managing receptions.
/// </summary>
[ApiController]
[Authorize]
[Route("api/receptions")]
public sealed class ReceptionsController : ControllerBase
{
    private readonly CreateReceptionUseCase _create;
    private readonly GetReceptionByIdUseCase _getById;

    public ReceptionsController(CreateReceptionUseCase create, GetReceptionByIdUseCase getById)
    {
        _create = create;
        _getById = getById;
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<ReceptionResponse>> Create(CreateReceptionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _create.ExecuteAsync(
                new CreateReceptionInput(
                    request.ReceptionDate,
                    request.Reference,
                    request.HasIssue,
                    request.IssueNote,
                    request.SupplierId),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new ReceptionResponse(
                result.Id,
                result.CompanyId,
                result.ReceptionDate,
                result.Reference,
                result.HasIssue,
                result.IssueNote,
                result.Status,
                result.AccountId,
                result.SupplierId,
                result.CreatedAt));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// [GET] Retrieves a reception by its ID.
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReceptionResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getById.ExecuteAsync(new GetReceptionByIdInput(id), cancellationToken);

            return Ok(new ReceptionResponse(
                result.Id,
                result.CompanyId,
                result.ReceptionDate,
                result.Reference,
                result.HasIssue,
                result.IssueNote,
                result.Status,
                result.AccountId,
                result.SupplierId,
                result.CreatedAt));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}