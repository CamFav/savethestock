using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Orders.Common;

internal static class OrderMappings
{
    public static OrderView ToView(Order order)
    {
        var receptionIds = order.Receptions
            .OrderBy(r => r.CreatedAt)
            .Select(r => r.Id)
            .ToList()
            .AsReadOnly();

        var lines = order.Lines
            .OrderBy(line => line.ProductName)
            .Select(line => new OrderLineView(
                line.Id,
                line.ProductId,
                line.ProductName,
                line.Unit,
                line.QuantityOrdered,
                line.QuantityReceived,
                line.UnitPrice))
            .ToList()
            .AsReadOnly();

        return new OrderView(
            order.Id,
            order.Reference,
            order.OrderDate,
            order.SupplierId,
            order.Status,
            order.Notes,
            order.CreatedAt,
            order.UpdatedAt,
            receptionIds,
            lines);
    }
}
