using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Orders.Common;

internal static class OrderStatusCalculator
{
    public static string Recompute(Order order)
    {
        if (order.Status == "CANCELLED")
        {
            return "CANCELLED";
        }

        var totalOrdered = order.Lines.Sum(line => line.QuantityOrdered);
        var totalReceived = order.Lines.Sum(line => Math.Min(line.QuantityReceived, line.QuantityOrdered));

        if (totalOrdered > 0 && totalReceived >= totalOrdered)
        {
            return "RECEIVED";
        }

        if (totalReceived > 0)
        {
            return "PARTIALLY_RECEIVED";
        }

        return order.Status;
    }
}
