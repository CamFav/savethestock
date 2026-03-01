using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Receptions;
using SaveTheStock.Application.Catalog.Receptions.Create;
using SaveTheStock.Application.Catalog.Receptions.GetById;
using SaveTheStock.Application.Catalog.Receptions.GetPaged;
using SaveTheStock.Application.Catalog.Receptions.Delete;
using SaveTheStock.Application.Catalog.Receptions.Update;
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
    private readonly GetReceptionsPagedUseCase _getPaged;
    private readonly DeleteReceptionUseCase _delete;
    private readonly UpdateReceptionUseCase _update;

    public ReceptionsController(CreateReceptionUseCase create,
        GetReceptionByIdUseCase getById,
        GetReceptionsPagedUseCase getPaged,
        DeleteReceptionUseCase delete,
        UpdateReceptionUseCase update)
    {
        _create = create;
        _getById = getById;
        _getPaged = getPaged;
        _delete = delete;
        _update = update;
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

    /// <summary>
    /// [GET] Retrieves a paginated list of receptions.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedReceptionsResponse>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _getPaged.ExecuteAsync(new GetReceptionsPagedInput(page, pageSize), cancellationToken);

            var items = result.Items.Select(x => new ReceptionResponse(
                x.Id,
                x.CompanyId,
                x.ReceptionDate,
                x.Reference,
                x.HasIssue,
                x.IssueNote,
                x.Status,
                x.AccountId,
                x.SupplierId,
                x.CreatedAt)).ToList();

            return Ok(new PagedReceptionsResponse(items, result.Page, result.PageSize, result.Total));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// [DELETE] Deletes a reception by its ID.
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _delete.ExecuteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    /// <summary>
    /// [PUT] Updates a reception by its ID.
    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReceptionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await _update.ExecuteAsync(
                new UpdateReceptionInput(
                    id,
                    request.ReceptionDate,
                    request.Reference,
                    request.HasIssue,
                    request.IssueNote,
                    request.SupplierId),
                cancellationToken);

            return NoContent();
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