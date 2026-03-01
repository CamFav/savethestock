using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Suppliers;
using SaveTheStock.Application.Common.Security;
using SaveTheStock.Application.Directory.Suppliers.Create;

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

    public SuppliersController(CreateSupplierUseCase create)
    {
        _create = create;
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<SupplierResponse>> Create(CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _create.ExecuteAsync(new CreateSupplierInput(request.Name), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new SupplierResponse(result.Id, result.Name));
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
}