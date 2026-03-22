using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Suppliers;
using SaveTheStock.Application.Common.Security;
using SaveTheStock.Application.Directory.Suppliers.Create;
using SaveTheStock.Application.Directory.Suppliers.Delete;
using SaveTheStock.Application.Directory.Suppliers.GetById;
using SaveTheStock.Application.Directory.Suppliers.GetPaged;
using SaveTheStock.Application.Directory.Suppliers.Update;

namespace SaveTheStock.Api.Controllers;

/// <summary>
/// Provides HTTP endpoints for managing suppliers.
/// </summary>
[ApiController]
[Authorize]
[Route("api/suppliers")]
public sealed class SuppliersController : ControllerBase
{
    private readonly CreateSupplierUseCase _create;
    private readonly GetSupplierByIdUseCase _getById;
    private readonly GetSuppliersPagedUseCase _getPaged;
    private readonly UpdateSupplierUseCase _update;
    private readonly DeleteSupplierUseCase _delete;

    public SuppliersController(
        CreateSupplierUseCase create,
        GetSupplierByIdUseCase getById,
        GetSuppliersPagedUseCase getPaged,
        UpdateSupplierUseCase update,
        DeleteSupplierUseCase delete)
    {
        _create = create;
        _getById = getById;
        _getPaged = getPaged;
        _update = update;
        _delete = delete;
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<SupplierResponse>> Create(
        [FromBody] CreateSupplierRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _create.ExecuteAsync(
                new CreateSupplierInput(request.Name, request.Email, request.Phone),
                cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new SupplierResponse(result.Id, result.Name, result.Email, result.Phone));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "duplicate_name")
        {
            return Conflict();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SupplierResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getById.ExecuteAsync(new GetSupplierByIdInput(id), cancellationToken);
            return Ok(new SupplierResponse(result.Id, result.Name, result.Email, result.Phone));
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
    public async Task<ActionResult<PagedSuppliersResponse>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _getPaged.ExecuteAsync(
                new GetSuppliersPagedInput(page, pageSize),
                cancellationToken);

            var items = result.Items
                .Select(i => new SupplierResponse(i.Id, i.Name, i.Email, i.Phone))
                .ToList()
                .AsReadOnly();

            return Ok(new PagedSuppliersResponse(items, result.Page, result.PageSize, result.Total));
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

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateSupplierRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _update.ExecuteAsync(
                new UpdateSupplierInput(id, request.Name, request.Email, request.Phone),
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
        catch (InvalidOperationException ex) when (ex.Message == "duplicate_name")
        {
            return Conflict();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _delete.ExecuteAsync(new DeleteSupplierInput(id), cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }
}
