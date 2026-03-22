using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.RemoveLine;

public sealed class RemoveOrderLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public RemoveOrderLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(RemoveOrderLineInput input, CancellationToken cancellationToken)
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

        order.Lines.Remove(line);
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return OrderMappings.ToView(order);
    }
}
