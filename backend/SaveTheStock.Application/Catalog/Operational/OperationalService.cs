using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Operational;

public sealed class OperationalService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public OperationalService(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OperationalTodayResult> GetTodayAsync(
        int expiryDays,
        bool lowStockOnly,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (expiryDays < 0)
            throw new InvalidOperationException("invalid_expiry_days");

        // Restaurant business rule:
        // expiry dates are evaluated using local calendar day, not UTC.
        var today = DateOnly.FromDateTime(DateTime.Today);
        var toDate = today.AddDays(expiryDays);

        var expiringLots = await _db.GetOperationalExpiringLotsAsync(companyId, today, toDate, cancellationToken);
        var expiredLots = await _db.GetOperationalExpiredLotsAsync(companyId, today, cancellationToken);

        var lowStockProducts = lowStockOnly
            ? await _db.GetOperationalLowStockProductsAsync(companyId, cancellationToken)
            : [];

        return new OperationalTodayResult(
            expiringLots,
            expiredLots,
            lowStockProducts,
            new OperationalQuickStats(
                expiringLots.Count,
                expiredLots.Count,
                lowStockProducts.Count));
    }
}

public sealed record OperationalQuickStats(
    int ExpiringCount,
    int ExpiredCount,
    int LowStockCount);

public sealed record OperationalTodayResult(
    IReadOnlyList<OperationalLotItemData> ExpiringLots,
    IReadOnlyList<OperationalLotItemData> ExpiredLots,
    IReadOnlyList<OperationalLowStockProductData> LowStockProducts,
    OperationalQuickStats QuickStats);
