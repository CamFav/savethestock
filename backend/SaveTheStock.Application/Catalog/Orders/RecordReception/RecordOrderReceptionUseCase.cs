using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.RecordReception;

public sealed class RecordOrderReceptionUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public RecordOrderReceptionUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(RecordOrderReceptionInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var order = await _db.FindOrderByIdAndCompanyIdForUpdateAsync(input.OrderId, companyId, cancellationToken);
        if (order is null)
        {
            throw new InvalidOperationException("order_not_found");
        }

        if (order.Status == "CANCELLED")
        {
            throw new InvalidOperationException("invalid_state");
        }

        var reception = await _db.FindReceptionByIdAndCompanyIdAsync(input.ReceptionId, companyId, cancellationToken);
        if (reception is null)
        {
            throw new InvalidOperationException("reception_not_found");
        }

        if (reception.OrderId.HasValue && reception.OrderId.Value != order.Id)
        {
            throw new InvalidOperationException("reception_already_linked");
        }

        reception.OrderId = order.Id;

        foreach (var receivedLine in input.Lines)
        {
            if (receivedLine.QuantityReceived <= 0)
            {
                continue;
            }

            var orderLine = order.Lines.FirstOrDefault(line => line.ProductId == receivedLine.ProductId);
            if (orderLine is null)
            {
                throw new InvalidOperationException("line_not_found");
            }

            var remaining = orderLine.QuantityOrdered - orderLine.QuantityReceived;
            if (receivedLine.QuantityReceived > remaining)
            {
                throw new InvalidOperationException("quantity_exceeds_remaining");
            }

            orderLine.QuantityReceived += receivedLine.QuantityReceived;
        }

        order.UpdatedAt = DateTime.UtcNow;
        order.Status = OrderStatusCalculator.Recompute(order);

        await _db.SaveChangesAsync(cancellationToken);
        return OrderMappings.ToView(order);
    }
}
