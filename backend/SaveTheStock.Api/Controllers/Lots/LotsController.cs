using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Lots;
using SaveTheStock.Application.Catalog.Lots.Create;
using SaveTheStock.Application.Catalog.Lots.GetById;
using SaveTheStock.Application.Catalog.Lots.GetPaged;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/lots")]
public sealed class LotsController : ControllerBase
{
    private readonly CreateLotUseCase _createLot;
    private readonly GetLotByIdUseCase _getById;
    private readonly GetLotsPagedUseCase _getPaged;

    public LotsController(CreateLotUseCase createLot, GetLotByIdUseCase getById, GetLotsPagedUseCase getPaged)
    {
        _createLot = createLot;
        _getById = getById;
        _getPaged = getPaged;
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<LotResponse>> Create(
        [FromBody] CreateLotRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _createLot.ExecuteAsync(
                new CreateLotInput(
                    request.ProductId,
                    request.ReceptionId,
                    request.LotCode,
                    request.ExpiryDate,
                    request.UnitCost,
                    request.QuantityInitial),
                cancellationToken);

            var response = new LotResponse(
                result.Id,
                result.CompanyId,
                result.ProductId,
                result.ReceptionId,
                result.LotCode,
                result.ExpiryDate,
                result.UnitCost,
                result.QuantityInitial,
                result.QuantityRemaining,
                result.HasIssue,
                result.IssueNote,
                result.CreatedAt);

            return StatusCode(StatusCodes.Status201Created, response);
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
    /// [GET] Gets a lot by its ID.
    /// </summary>
    /// <returns></returns>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LotResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getById.ExecuteAsync(new GetLotByIdInput(id), cancellationToken);

            return Ok(new LotResponse(
                result.Id,
                result.CompanyId,
                result.ProductId,
                result.ReceptionId,
                result.LotCode,
                result.ExpiryDate,
                result.UnitCost,
                result.QuantityInitial,
                result.QuantityRemaining,
                result.HasIssue,
                result.IssueNote,
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

    [HttpGet]
    public async Task<ActionResult<PagedLotsResponse>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? productId = null,
        [FromQuery] Guid? receptionId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _getPaged.ExecuteAsync(
                new GetLotsPagedInput(page, pageSize, productId, receptionId),
                cancellationToken);

            var items = result.Items.Select(x => new LotResponse(
                x.Id,
                x.CompanyId,
                x.ProductId,
                x.ReceptionId,
                x.LotCode,
                x.ExpiryDate,
                x.UnitCost,
                x.QuantityInitial,
                x.QuantityRemaining,
                x.HasIssue,
                x.IssueNote,
                x.CreatedAt)).ToList();

            return Ok(new PagedLotsResponse(items, result.Page, result.PageSize, result.Total));
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