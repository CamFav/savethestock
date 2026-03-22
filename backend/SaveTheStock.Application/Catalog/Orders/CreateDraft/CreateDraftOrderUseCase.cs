using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Orders.CreateDraft;

public sealed class CreateDraftOrderUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateDraftOrderUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderView> ExecuteAsync(CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();
        var accountId = _currentUser.AccountId ?? throw new UnauthorizedAccessException();

        var now = DateTime.UtcNow;
        var orderDate = DateOnly.FromDateTime(now);
        var countForDate = await _db.CountOrdersForDateAsync(companyId, orderDate, cancellationToken);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Reference = BuildReference(orderDate, countForDate + 1),
            OrderDate = orderDate,
            SupplierId = null,
            Status = "DRAFT",
            Notes = null,
            AccountId = accountId,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.AddOrder(order);
        await _db.SaveChangesAsync(cancellationToken);

        return OrderMappings.ToView(order);
    }

    private static string BuildReference(DateOnly orderDate, int sequence)
        => $"CMD-{orderDate:yyyyMMdd}-{sequence:000}";
}
