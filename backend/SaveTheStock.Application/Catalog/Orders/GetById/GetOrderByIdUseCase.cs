using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Orders.GetById;

public sealed class GetOrderByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetOrderByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(GetOrderByIdInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var order = await _db.FindOrderByIdAndCompanyIdAsync(input.OrderId, companyId, cancellationToken);
        if (order is null)
        {
            throw new InvalidOperationException("not_found");
        }

        return OrderMappings.ToView(order);
    }
}
