using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Orders.AddLine;

public sealed class AddOrderLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public AddOrderLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(AddOrderLineInput input, CancellationToken cancellationToken)
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

        var product = await _db.FindProductByIdAndCompanyIdAsync(input.ProductId, companyId, cancellationToken);
        if (product is null)
        {
            throw new InvalidOperationException("product_not_found");
        }

        var quantity = input.Quantity.GetValueOrDefault(1m);
        if (quantity <= 0)
        {
            throw new InvalidOperationException("invalid_quantity");
        }

        var existingLine = order.Lines.FirstOrDefault(line => line.ProductId == product.Id);
        if (existingLine is not null)
        {
            existingLine.QuantityOrdered += quantity;
            existingLine.UnitPrice = input.UnitPrice ?? existingLine.UnitPrice;
        }
        else
        {
            order.Lines.Add(new OrderLine
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                OrderId = order.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                Unit = product.Unit,
                QuantityOrdered = quantity,
                QuantityReceived = 0m,
                UnitPrice = input.UnitPrice
            });
        }

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return OrderMappings.ToView(order);
    }
}
