using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.UpdateLine;

public sealed class UpdateOrderLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateOrderLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(UpdateOrderLineInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var order = await _db.FindOrderByIdAndCompanyIdForUpdateAsync(input.OrderId, companyId, cancellationToken);
        if (order is null)
        {
            throw new InvalidOperationException("not_found");
        }

        if (order.Status != "DRAFT")
        {
            throw new InvalidOperationException("invalid_state");
        }

        var line = order.Lines.FirstOrDefault(item => item.Id == input.OrderLineId);
        if (line is null)
        {
            throw new InvalidOperationException("line_not_found");
        }

        if (input.QuantityOrdered <= 0)
        {
            throw new InvalidOperationException("invalid_quantity");
        }

        if (input.QuantityOrdered < line.QuantityReceived)
        {
            throw new InvalidOperationException("quantity_below_received");
        }

        line.QuantityOrdered = input.QuantityOrdered;
        line.UnitPrice = input.UnitPrice;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return OrderMappings.ToView(order);
    }
}
