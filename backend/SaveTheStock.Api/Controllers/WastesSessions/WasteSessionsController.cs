using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.WasteSessions;
using SaveTheStock.Application.Catalog.WasteSessions.AddLine;
using SaveTheStock.Application.Catalog.WasteSessions.Create;
using SaveTheStock.Application.Catalog.WasteSessions.GetById;
using SaveTheStock.Application.Catalog.WasteSessions.GetPaged;
using SaveTheStock.Application.Catalog.WasteSessions.Post;
using SaveTheStock.Application.Catalog.WasteSessions.RemoveLine;
using SaveTheStock.Application.Catalog.WasteSessions.UpdateLine;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/waste-sessions")]
public sealed class WasteSessionsController : ControllerBase
{
    private readonly CreateWasteSessionUseCase _create;
    private readonly GetWasteSessionsPagedUseCase _getPaged;
    private readonly GetWasteSessionByIdUseCase _getById;
    private readonly AddWasteLineUseCase _addLine;
    private readonly UpdateWasteLineUseCase _updateLine;
    private readonly RemoveWasteLineUseCase _removeLine;
    private readonly PostWasteSessionUseCase _post;

    public WasteSessionsController(
        CreateWasteSessionUseCase create,
        GetWasteSessionsPagedUseCase getPaged,
        GetWasteSessionByIdUseCase getById,
        AddWasteLineUseCase addLine,
        UpdateWasteLineUseCase updateLine,
        RemoveWasteLineUseCase removeLine,
        PostWasteSessionUseCase post)
    {
        _create = create;
        _getPaged = getPaged;
        _getById = getById;
        _addLine = addLine;
        _updateLine = updateLine;
        _removeLine = removeLine;
        _post = post;
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<WasteSessionResponse>> Create(
        [FromBody] CreateWasteSessionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _create.ExecuteAsync(
                new CreateWasteSessionInput(request.WasteDate, request.Comment),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new WasteSessionResponse(
                result.Id,
                result.CompanyId,
                result.AccountId,
                result.WasteDate,
                result.Status,
                result.Comment,
                result.CreatedAt,
                []));
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

    [HttpGet]
    public async Task<ActionResult<PagedWasteSessionsResponse>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _getPaged.ExecuteAsync(
                new GetWasteSessionsPagedInput(page, pageSize, from, to, status),
                cancellationToken);

            var items = result.Items.Select(x => new WasteSessionResponse(
                x.Id,
                x.CompanyId,
                x.AccountId,
                x.WasteDate,
                x.Status,
                x.Comment,
                x.CreatedAt,
                [])).ToList();

            return Ok(new PagedWasteSessionsResponse(items, result.Page, result.PageSize, result.Total));
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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WasteSessionResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getById.ExecuteAsync(new GetWasteSessionByIdInput(id), cancellationToken);

            var lines = result.Lines.Select(x => new WasteLineResponse(
                x.Id,
                x.CompanyId,
                x.WasteSessionId,
                x.LotId,
                x.Quantity,
                x.Reason)).ToList();

            return Ok(new WasteSessionResponse(
                result.Id,
                result.CompanyId,
                result.AccountId,
                result.WasteDate,
                result.Status,
                result.Comment,
                result.CreatedAt,
                lines));
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

    [HttpPost("{id:guid}/lines")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<WasteLineResponse>> AddLine(
        Guid id,
        [FromBody] AddWasteLineRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _addLine.ExecuteAsync(
                new AddWasteLineInput(id, request.LotId, request.Quantity, request.Reason),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new WasteLineResponse(
                result.Id,
                result.CompanyId,
                result.WasteSessionId,
                result.LotId,
                result.Quantity,
                result.Reason));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "duplicate_lot")
        {
            return Conflict("duplicate_lot");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}/lines/{lineId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<IActionResult> UpdateLine(
        Guid id,
        Guid lineId,
        [FromBody] UpdateWasteLineRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _updateLine.ExecuteAsync(
                new UpdateWasteLineInput(id, lineId, request.Quantity, request.Reason),
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

    [HttpDelete("{id:guid}/lines/{lineId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<IActionResult> RemoveLine(Guid id, Guid lineId, CancellationToken cancellationToken)
    {
        try
        {
            await _removeLine.ExecuteAsync(new RemoveWasteLineInput(id, lineId), cancellationToken);
            return NoContent();
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

    [HttpPost("{id:guid}/post")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<IActionResult> Post(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _post.ExecuteAsync(new PostWasteSessionInput(id), cancellationToken);
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
        catch (InvalidOperationException ex) when (ex.Message == "already_posted")
        {
            return Conflict("already_posted");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
