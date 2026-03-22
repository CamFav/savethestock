using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.Update;

public sealed class UpdateOrderUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateOrderUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(UpdateOrderInput input, CancellationToken cancellationToken)
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

        if (input.SupplierId.HasValue)
        {
            var supplier = await _db.FindSupplierByIdAndCompanyIdAsync(input.SupplierId.Value, companyId, cancellationToken);
            if (supplier is null)
            {
                throw new InvalidOperationException("supplier_not_found");
            }
        }

        order.OrderDate = input.OrderDate;
        order.SupplierId = input.SupplierId;
        order.Notes = string.IsNullOrWhiteSpace(input.Notes) ? null : input.Notes.Trim();
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return OrderMappings.ToView(order);
    }
}
