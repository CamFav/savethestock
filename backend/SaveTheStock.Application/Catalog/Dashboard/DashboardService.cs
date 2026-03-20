using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Dashboard;

public sealed class DashboardService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DashboardService(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<DashboardSummaryResult> GetSummaryAsync(
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();
        ValidateRange(from, to);
        // Restaurant business rule:
        // expiry dates are evaluated using local calendar day, not UTC.
        var today = DateOnly.FromDateTime(DateTime.Today);

        var (stockUsableValue, stockExpiredValue, stockTotalValue) = await _db.GetStockValuesAsync(companyId, today, cancellationToken);
        var (wasteValue, wasteQty) = await _db.GetWasteTotalsAsync(companyId, from, to, cancellationToken);
        var receptionsValue = await _db.GetReceptionsValueAsync(companyId, from, to, cancellationToken);
        var inventoryVarianceValue = await _db.GetInventoryVarianceValueAsync(companyId, from, to, cancellationToken);

        decimal? wasteRate = null;
        if (receptionsValue > 0)
        {
            wasteRate = wasteValue / receptionsValue;
        }

        return new DashboardSummaryResult(
            stockUsableValue,
            stockExpiredValue,
            stockTotalValue,
            wasteValue,
            wasteQty,
            receptionsValue,
            wasteRate,
            inventoryVarianceValue);
    }

    public async Task<IReadOnlyList<WasteTrendPointData>> GetWasteTrendAsync(
        int days,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (days <= 0)
            throw new InvalidOperationException("invalid_days");

        var today = DateOnly.FromDateTime(DateTime.Today);
        var fromDate = today.AddDays(-(days - 1));

        return await _db.GetWasteTrendAsync(companyId, fromDate, today, cancellationToken);
    }

    public async Task<IReadOnlyList<TopWasteProductData>> GetTopWasteProductsAsync(
        DateOnly? from,
        DateOnly? to,
        int limit,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();
        ValidateRange(from, to);

        if (limit <= 0)
            throw new InvalidOperationException("invalid_limit");

        return await _db.GetTopWasteProductsAsync(companyId, from, to, limit, cancellationToken);
    }

    public async Task<DashboardAlertsResult> GetAlertsAsync(
        int expiryDays,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (expiryDays < 0)
            throw new InvalidOperationException("invalid_expiry_days");

        var today = DateOnly.FromDateTime(DateTime.Today);
        var toDate = today.AddDays(expiryDays);

        var lowStock = await _db.GetLowStockProductsAsync(companyId, today, cancellationToken);
        var expiring = await _db.GetExpiringLotsAsync(companyId, today, toDate, cancellationToken);
        var expired = await _db.GetExpiredLotsAsync(companyId, today, cancellationToken);
        var expiredStockValue = await _db.GetExpiredStockValueAsync(companyId, today, cancellationToken);

        return new DashboardAlertsResult(lowStock, expiring, expired, expiredStockValue);
    }

    private static void ValidateRange(DateOnly? from, DateOnly? to)
    {
        if (from.HasValue && to.HasValue && from.Value > to.Value)
            throw new InvalidOperationException("invalid_date_range");
    }
}

public sealed record DashboardSummaryResult(
    decimal StockUsableValue,
    decimal StockExpiredValue,
    decimal StockTotalValue,
    decimal WasteValue,
    decimal WasteQty,
    decimal? ReceptionsValue,
    decimal? WasteRate,
    decimal InventoryVarianceValue);

public sealed record DashboardAlertsResult(
    IReadOnlyList<LowStockProductAlertData> LowStockProducts,
    IReadOnlyList<LotAlertData> ExpiringLots,
    IReadOnlyList<LotAlertData> ExpiredLots,
    decimal ExpiredStockValue);
