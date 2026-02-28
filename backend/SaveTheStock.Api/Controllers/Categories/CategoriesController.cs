using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Categories;
using SaveTheStock.Application.Catalog.Categories.Create;
using SaveTheStock.Application.Catalog.Categories.GetMyById;
using SaveTheStock.Application.Catalog.Categories.GetMyListPaged;
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
    private readonly GetMyCategoriesPagedUseCase _getPaged;
    private readonly GetMyCategoryByIdUseCase _getById;

    public CategoriesController(
        CreateCategoryUseCase create,
        GetMyCategoriesPagedUseCase getPaged,
        GetMyCategoryByIdUseCase getById)
    {
        _create = create;
        _getPaged = getPaged;
        _getById = getById;
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

    [HttpGet]
    [ProducesResponseType(typeof(PagedCategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedCategoryResponse>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _getPaged.ExecuteAsync(
                new GetMyCategoriesPagedInput(page, pageSize),
                cancellationToken);

            var items = result.Items
                .Select(i => new CategoryResponse(i.Id, i.CompanyId, i.Name, i.CreatedAt))
                .ToList()
                .AsReadOnly();

            return Ok(new PagedCategoryResponse(items, result.Total, result.Page, result.PageSize));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _getById.ExecuteAsync(id, cancellationToken);

            return Ok(new CategoryResponse(
                result.Id,
                result.CompanyId,
                result.Name,
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
    }
}