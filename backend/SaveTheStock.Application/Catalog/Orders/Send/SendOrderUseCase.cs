using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.Send;

public sealed class SendOrderUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public SendOrderUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(SendOrderInput input, CancellationToken cancellationToken)
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

        order.Status = "SENT";
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return OrderMappings.ToView(order);
    }
}
