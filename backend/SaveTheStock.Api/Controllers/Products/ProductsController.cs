using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Products;
using SaveTheStock.Application.Catalog.Products.Create;
using SaveTheStock.Application.Catalog.Products.GetById;
using SaveTheStock.Application.Catalog.Products.GetPaged;
using SaveTheStock.Application.Catalog.Products.Update;
using SaveTheStock.Application.Catalog.Products.Delete;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public sealed class ProductsController : ControllerBase
{
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create(
        [FromServices] CreateProductUseCase useCase,
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var input = new CreateProductInput(
                request.CategoryId,
                request.Name,
                request.Unit,
                request.AlertThreshold,
                request.IsActive);

            var result = await useCase.ExecuteAsync(input, cancellationToken);

            var response = new ProductResponse(
                result.Id,
                result.CompanyId,
                result.CategoryId,
                result.Name,
                result.Unit,
                result.AlertThreshold,
                result.IsActive,
                result.CreatedAt);

            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "duplicate_name")
        {
            return Conflict("Product name already used.");
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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductResponse>> GetById(
        [FromServices] GetProductByIdUseCase useCase,
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await useCase.ExecuteAsync(new GetProductByIdInput(id), cancellationToken);

            var response = new ProductResponse(
                result.Id,
                result.CompanyId,
                result.CategoryId,
                result.Name,
                result.Unit,
                result.AlertThreshold,
                result.IsActive,
                result.CreatedAt);

            return Ok(response);
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
    public async Task<ActionResult<PagedProductsResponse>> GetPaged(
        [FromServices] GetProductsPagedUseCase useCase,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await useCase.ExecuteAsync(
                new GetProductsPagedInput(page, pageSize, categoryId),
                cancellationToken);

            var items = result.Items
                .Select(p => new ProductResponse(
                    p.Id,
                    p.CompanyId,
                    p.CategoryId,
                    p.Name,
                    p.Unit,
                    p.AlertThreshold,
                    p.IsActive,
                    p.CreatedAt))
                .ToList();

            return Ok(new PagedProductsResponse(items, result.Total, result.Page, result.PageSize));
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
    public async Task<ActionResult<ProductResponse>> Update(
        [FromServices] UpdateProductUseCase useCase,
        [FromRoute] Guid id,
        [FromBody] UpdateProductRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var input = new UpdateProductInput(
                id,
                request.CategoryId,
                request.Name,
                request.Unit,
                request.AlertThreshold,
                request.IsActive);

            var result = await useCase.ExecuteAsync(input, cancellationToken);

            var response = new ProductResponse(
                result.Id,
                result.CompanyId,
                result.CategoryId,
                result.Name,
                result.Unit,
                result.AlertThreshold,
                result.IsActive,
                result.CreatedAt);

            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex) when (ex.Message == "duplicate_name")
        {
            return Conflict("Product name already used.");
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

    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        [FromServices] DeleteProductUseCase useCase,
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            await useCase.ExecuteAsync(new DeleteProductInput(id), cancellationToken);
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
}
