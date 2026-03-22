using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Orders;
using SaveTheStock.Application.Catalog.Orders.AddLine;
using SaveTheStock.Application.Catalog.Orders.AddToDraft;
using SaveTheStock.Application.Catalog.Orders.Cancel;
using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Catalog.Orders.CreateDraft;
using SaveTheStock.Application.Catalog.Orders.Delete;
using SaveTheStock.Application.Catalog.Orders.GetById;
using SaveTheStock.Application.Catalog.Orders.GetPaged;
using SaveTheStock.Application.Catalog.Orders.RecordReception;
using SaveTheStock.Application.Catalog.Orders.RemoveLine;
using SaveTheStock.Application.Catalog.Orders.Send;
using SaveTheStock.Application.Catalog.Orders.Update;
using SaveTheStock.Application.Catalog.Orders.UpdateLine;
using SaveTheStock.Application.Common.Security;

namespace SaveTheStock.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public sealed class OrdersController : ControllerBase
{
    private readonly CreateDraftOrderUseCase _createDraft;
    private readonly GetOrdersPagedUseCase _getPaged;
    private readonly GetOrderByIdUseCase _getById;
    private readonly AddProductToDraftOrderUseCase _addToDraft;
    private readonly UpdateOrderUseCase _update;
    private readonly AddOrderLineUseCase _addLine;
    private readonly UpdateOrderLineUseCase _updateLine;
    private readonly RemoveOrderLineUseCase _removeLine;
    private readonly DeleteOrderUseCase _delete;
    private readonly SendOrderUseCase _send;
    private readonly CancelOrderUseCase _cancel;
    private readonly RecordOrderReceptionUseCase _recordReception;

    public OrdersController(
        CreateDraftOrderUseCase createDraft,
        GetOrdersPagedUseCase getPaged,
        GetOrderByIdUseCase getById,
        AddProductToDraftOrderUseCase addToDraft,
        UpdateOrderUseCase update,
        AddOrderLineUseCase addLine,
        UpdateOrderLineUseCase updateLine,
        RemoveOrderLineUseCase removeLine,
        DeleteOrderUseCase delete,
        SendOrderUseCase send,
        CancelOrderUseCase cancel,
        RecordOrderReceptionUseCase recordReception)
    {
        _createDraft = createDraft;
        _getPaged = getPaged;
        _getById = getById;
        _addToDraft = addToDraft;
        _update = update;
        _addLine = addLine;
        _updateLine = updateLine;
        _removeLine = removeLine;
        _delete = delete;
        _send = send;
        _cancel = cancel;
        _recordReception = recordReception;
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> CreateDraft(CancellationToken cancellationToken)
        => Ok(ToResponse(await _createDraft.ExecuteAsync(cancellationToken)));

    [HttpGet]
    public async Task<ActionResult<PagedOrdersResponse>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _getPaged.ExecuteAsync(new GetOrdersPagedInput(page, pageSize), cancellationToken);
        return Ok(new PagedOrdersResponse(result.Items.Select(ToResponse).ToList().AsReadOnly(), result.Page, result.PageSize, result.Total));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _getById.ExecuteAsync(new GetOrderByIdInput(id), cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
    }

    [HttpPost("draft/lines")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> AddProductToDraft(
        [FromBody] AddProductToDraftOrderRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _addToDraft.ExecuteAsync(
                new AddProductToDraftOrderInput(request.ProductId, request.Quantity, request.UnitPrice),
                cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "product_not_found")
        {
            return NotFound("Produit introuvable.");
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> Update(
        Guid id,
        [FromBody] UpdateOrderRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _update.ExecuteAsync(
                new UpdateOrderInput(id, request.OrderDate, request.SupplierId, request.Notes),
                cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "supplier_not_found")
        {
            return NotFound("Fournisseur introuvable.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Cette commande ne peut plus être modifiée.");
        }
    }

    [HttpPost("{id:guid}/lines")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> AddLine(
        Guid id,
        [FromBody] AddOrderLineRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _addLine.ExecuteAsync(
                new AddOrderLineInput(id, request.ProductId, request.Quantity, request.UnitPrice),
                cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "product_not_found")
        {
            return NotFound("Produit introuvable.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_quantity")
        {
            return BadRequest("La quantité doit être supérieure à zéro.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Cette commande ne peut plus être modifiée.");
        }
    }

    [HttpPut("{id:guid}/lines/{lineId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> UpdateLine(
        Guid id,
        Guid lineId,
        [FromBody] UpdateOrderLineRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _updateLine.ExecuteAsync(
                new UpdateOrderLineInput(id, lineId, request.QuantityOrdered, request.UnitPrice),
                cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found" || ex.Message == "line_not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_quantity")
        {
            return BadRequest("La quantité doit être supérieure à zéro.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "quantity_below_received")
        {
            return BadRequest("La quantité commandée ne peut pas être inférieure à la quantité déjà reçue.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Cette commande ne peut plus être modifiée.");
        }
    }

    [HttpDelete("{id:guid}/lines/{lineId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> RemoveLine(Guid id, Guid lineId, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _removeLine.ExecuteAsync(new RemoveOrderLineInput(id, lineId), cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found" || ex.Message == "line_not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Cette commande ne peut plus être modifiée.");
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _delete.ExecuteAsync(new DeleteOrderInput(id), cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Seuls les brouillons peuvent être supprimés.");
        }
    }

    [HttpPost("{id:guid}/send")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> Send(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _send.ExecuteAsync(new SendOrderInput(id), cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Cette commande ne peut pas être envoyée.");
        }
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(ToResponse(await _cancel.ExecuteAsync(new CancelOrderInput(id), cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Cette commande ne peut pas être annulée.");
        }
    }

    [HttpPost("{id:guid}/receptions")]
    [Authorize(Policy = AuthorizationPolicies.OwnerOnly)]
    public async Task<ActionResult<OrderResponse>> RecordReception(
        Guid id,
        [FromBody] RecordOrderReceptionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var lines = (request.Lines ?? Array.Empty<RecordOrderReceptionLineRequest>())
                .Select(line => new OrderReceptionQuantityInput(line.ProductId, line.QuantityReceived))
                .ToList()
                .AsReadOnly();

            return Ok(ToResponse(await _recordReception.ExecuteAsync(
                new RecordOrderReceptionInput(id, request.ReceptionId, lines),
                cancellationToken)));
        }
        catch (InvalidOperationException ex) when (ex.Message == "order_not_found" || ex.Message == "reception_not_found" || ex.Message == "line_not_found")
        {
            return NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message == "reception_already_linked")
        {
            return Conflict("Cette réception est déjà liée à une autre commande.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "quantity_exceeds_remaining")
        {
            return BadRequest("La quantité reçue dépasse le reste à recevoir.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_state")
        {
            return Conflict("Cette commande ne peut plus recevoir de livraison.");
        }
    }

    private static OrderResponse ToResponse(OrderView order)
    {
        return new OrderResponse(
            order.Id,
            order.Reference,
            order.OrderDate,
            order.SupplierId,
            order.Status,
            order.Notes,
            order.CreatedAt,
            order.UpdatedAt,
            order.ReceptionIds,
            order.Lines.Select(line => new OrderLineResponse(
                line.Id,
                line.ProductId,
                line.ProductName,
                line.Unit,
                line.QuantityOrdered,
                line.QuantityReceived,
                line.UnitPrice)).ToList().AsReadOnly());
    }
}
