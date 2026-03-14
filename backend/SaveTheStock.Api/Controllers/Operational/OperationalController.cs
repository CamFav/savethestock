using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Operational;
using SaveTheStock.Application.Catalog.Operational;

namespace SaveTheStock.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/operational")]
public sealed class OperationalController : ControllerBase
{
    private readonly OperationalService _operational;

    public OperationalController(OperationalService operational)
    {
        _operational = operational;
    }

    [HttpGet("today")]
    public async Task<ActionResult<OperationalTodayResponse>> GetToday(
        [FromQuery] int expiryDays = 3,
        [FromQuery] bool lowStockOnly = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _operational.GetTodayAsync(expiryDays, lowStockOnly, cancellationToken);

            return Ok(new OperationalTodayResponse(
                result.ExpiringLots
                    .Select(x => new OperationalLotItemResponse(
                        x.LotId,
                        x.LotCode,
                        x.ProductId,
                        x.ProductName,
                        x.ExpiryDate,
                        x.RemainingQty,
                        x.UnitCost,
                        x.RemainingValue))
                    .ToList(),
                result.ExpiredLots
                    .Select(x => new OperationalLotItemResponse(
                        x.LotId,
                        x.LotCode,
                        x.ProductId,
                        x.ProductName,
                        x.ExpiryDate,
                        x.RemainingQty,
                        x.UnitCost,
                        x.RemainingValue))
                    .ToList(),
                result.LowStockProducts
                    .Select(x => new OperationalLowStockProductResponse(
                        x.ProductId,
                        x.ProductName,
                        x.CurrentQty,
                        x.AlertThreshold))
                    .ToList(),
                new OperationalQuickStatsResponse(
                    result.QuickStats.ExpiringCount,
                    result.QuickStats.ExpiredCount,
                    result.QuickStats.LowStockCount)));
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
