using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Inventories;
using SaveTheStock.Application.Catalog.Inventories.Create;
using SaveTheStock.Application.Catalog.Inventories.GetById;
using SaveTheStock.Application.Catalog.Inventories.GetPaged;
using SaveTheStock.Application.Catalog.Inventories.Post;
using SaveTheStock.Application.Catalog.Inventories.RemoveLine;
using SaveTheStock.Application.Catalog.Inventories.UpdateLine;
using SaveTheStock.Application.Catalog.Inventories.UpsertLine;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/inventories")]
public sealed class InventoriesController : ControllerBase
{
    private readonly CreateInventoryUseCase _create;
    private readonly GetInventoriesPagedUseCase _getPaged;
    private readonly GetInventoryByIdUseCase _getById;
    private readonly UpsertInventoryLineUseCase _upsertLine;
    private readonly UpdateInventoryLineUseCase _updateLine;
    private readonly RemoveInventoryLineUseCase _removeLine;
    private readonly PostInventoryUseCase _post;

    public InventoriesController(
        CreateInventoryUseCase create,
        GetInventoriesPagedUseCase getPaged,
        GetInventoryByIdUseCase getById,
        UpsertInventoryLineUseCase upsertLine,
        UpdateInventoryLineUseCase updateLine,
        RemoveInventoryLineUseCase removeLine,
        PostInventoryUseCase post)
    {
        _create = create;
        _getPaged = getPaged;
        _getById = getById;
        _upsertLine = upsertLine;
        _updateLine = updateLine;
        _removeLine = removeLine;
        _post = post;
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<InventoryResponse>> Create(
        [FromBody] CreateInventoryRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _create.ExecuteAsync(
                new CreateInventoryInput(request.InventoryDate, request.Comment),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new InventoryResponse(
                result.Id,
                result.CompanyId,
                result.AccountId,
                result.InventoryDate,
                result.Status,
                result.Comment,
                result.CreatedAt,
                null,
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
    public async Task<ActionResult<PagedInventoriesResponse>> GetPaged(
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
                new GetInventoriesPagedInput(page, pageSize, from, to, status),
                cancellationToken);

            var items = result.Items.Select(x => new InventoryResponse(
                x.Id,
                x.CompanyId,
                x.AccountId,
                x.InventoryDate,
                x.Status,
                x.Comment,
                x.CreatedAt,
                x.PostedByName,
                [])).ToList();

            return Ok(new PagedInventoriesResponse(items, result.Page, result.PageSize, result.Total));
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
    public async Task<ActionResult<InventoryResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getById.ExecuteAsync(new GetInventoryByIdInput(id), cancellationToken);

            var lines = result.Lines.Select(x => new InventoryLineResponse(
                x.Id,
                x.CompanyId,
                x.InventoryId,
                x.ProductId,
                x.TheoreticalQuantity,
                x.RealQuantity)).ToList();

            return Ok(new InventoryResponse(
                result.Id,
                result.CompanyId,
                result.AccountId,
                result.InventoryDate,
                result.Status,
                result.Comment,
                result.CreatedAt,
                result.PostedByName,
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
    public async Task<ActionResult<InventoryLineResponse>> UpsertLine(
        Guid id,
        [FromBody] UpsertInventoryLineRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _upsertLine.ExecuteAsync(
                new UpsertInventoryLineInput(id, request.ProductId, request.RealQuantity),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new InventoryLineResponse(
                result.Id,
                result.CompanyId,
                result.InventoryId,
                result.ProductId,
                result.TheoreticalQuantity,
                result.RealQuantity));
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

    [HttpPut("{id:guid}/lines/{lineId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<IActionResult> UpdateLine(
        Guid id,
        Guid lineId,
        [FromBody] UpdateInventoryLineRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _updateLine.ExecuteAsync(
                new UpdateInventoryLineInput(id, lineId, request.RealQuantity),
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
            await _removeLine.ExecuteAsync(new RemoveInventoryLineInput(id, lineId), cancellationToken);
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
            await _post.ExecuteAsync(new PostInventoryInput(id), cancellationToken);
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
