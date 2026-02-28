using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Application.Catalog.Categories.Create;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Controllers.Categories;

/// <summary>
/// Provides HTTP endpoints for managing categories within the catalog.
/// </summary>
[ApiController]
[Route("api/categories")]
[Authorize]
public sealed class CategoriesController : ControllerBase
{
    private readonly CreateCategoryUseCase _create;

    public CategoriesController(CreateCategoryUseCase create)
    {
        _create = create;
    }

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPost]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CategoryResponse>> Create(
        [FromBody] CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _create.ExecuteAsync(
                new CreateCategoryInput(request.Name),
                cancellationToken);

            var response = new CategoryResponse(
                result.Id,
                result.CompanyId,
                result.Name,
                result.CreatedAt);

            return CreatedAtAction(nameof(Create), new { id = response.Id }, response);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "duplicate_name")
        {
            return Conflict("Category name already used.");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}