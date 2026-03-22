using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.Delete;

public sealed class DeleteOrderUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteOrderUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(DeleteOrderInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var order = await _db.FindOrderByIdAndCompanyIdForUpdateAsync(input.OrderId, companyId, cancellationToken);
        if (order is null)
        {
            return;
        }

        if (order.Status != "DRAFT")
        {
            throw new InvalidOperationException("invalid_state");
        }

        _db.RemoveOrder(order);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
