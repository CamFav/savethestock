using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Dashboard;
using SaveTheStock.Application.Catalog.Dashboard;

namespace SaveTheStock.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboard;

    public DashboardController(DashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _dashboard.GetSummaryAsync(from, to, cancellationToken);

            return Ok(new DashboardSummaryResponse(
                result.StockUsableValue,
                result.StockExpiredValue,
                result.StockTotalValue,
                result.WasteValue,
                result.WasteQty,
                result.ReceptionsValue,
                result.WasteRate,
                result.InventoryVarianceValue));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("waste-trend")]
    public async Task<ActionResult<IReadOnlyList<WasteTrendPointResponse>>> GetWasteTrend(
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _dashboard.GetWasteTrendAsync(days, cancellationToken);
            var items = result
                .Select(x => new WasteTrendPointResponse(x.Date, x.WasteValue, x.WasteQty))
                .ToList();

            return Ok(items);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("top-waste-products")]
    public async Task<ActionResult<IReadOnlyList<TopWasteProductResponse>>> GetTopWasteProducts(
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _dashboard.GetTopWasteProductsAsync(from, to, limit, cancellationToken);
            var items = result
                .Select(x => new TopWasteProductResponse(
                    x.ProductId,
                    x.ProductName,
                    x.TotalWasteQty,
                    x.TotalWasteValue))
                .ToList();

            return Ok(items);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<DashboardAlertsResponse>> GetAlerts(
        [FromQuery] int expiryDays = 3,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _dashboard.GetAlertsAsync(expiryDays, cancellationToken);

            return Ok(new DashboardAlertsResponse(
                result.LowStockProducts
                    .Select(x => new LowStockProductAlertResponse(
                        x.ProductId,
                        x.ProductName,
                        x.AlertThreshold,
                        x.QuantityRemaining))
                    .ToList(),
                result.ExpiringLots
                    .Select(x => new LotAlertResponse(
                        x.LotId,
                        x.ProductId,
                        x.ProductName,
                        x.LotCode,
                        x.ExpiryDate,
                        x.QuantityRemaining))
                    .ToList(),
                result.ExpiredLots
                    .Select(x => new LotAlertResponse(
                        x.LotId,
                        x.ProductId,
                        x.ProductName,
                        x.LotCode,
                        x.ExpiryDate,
                        x.QuantityRemaining))
                    .ToList(),
                result.ExpiredStockValue));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
