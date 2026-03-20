using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;
using System.Data;

namespace SaveTheStock.Application.Catalog.Inventories.Post;

public sealed class PostInventoryUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public PostInventoryUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(PostInventoryInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();
        var accountId = _currentUser.AccountId ?? throw new UnauthorizedAccessException();

        // Serializable + row-level locks ensure concurrent POST retries cannot
        // re-apply lot adjustments for the same inventory.
        await _db.ExecuteInTransactionAsync(async ct =>
        {
            var inventory = await _db.FindInventoryByIdAndCompanyIdForUpdateAsync(input.InventoryId, companyId, ct);
            if (inventory is null)
                throw new InvalidOperationException("not_found");

            if (inventory.Status == "POSTED")
                throw new InvalidOperationException("already_posted");

            if (inventory.Status != "DRAFT")
                throw new InvalidOperationException("invalid_status");

            var lines = await _db.GetInventoryLinesAsync(companyId, inventory.Id, ct);
            if (lines.Count == 0)
                throw new InvalidOperationException("empty_inventory");

            foreach (var line in lines.OrderBy(x => x.ProductId))
            {
                if (line.RealQuantity < 0)
                    throw new InvalidOperationException("invalid_quantity");

                var product = await _db.FindProductByIdAndCompanyIdAsync(line.ProductId, companyId, ct);
                if (product is null)
                    throw new InvalidOperationException("not_found");

                if (!product.IsActive)
                    throw new InvalidOperationException("inactive_product");

                var lots = (await _db.GetActiveLotsByProductForUpdateAsync(companyId, line.ProductId, ct)).ToList();
                if (lots.Count == 0)
                    throw new InvalidOperationException("no_lot_for_product");

                var theoretical = lots.Sum(x => x.QuantityRemaining);
                line.TheoreticalQuantity = theoretical;

                var delta = line.RealQuantity - theoretical;
                if (delta == 0)
                    continue;

                if (delta < 0)
                {
                    var toDecrement = -delta;

                    var fefoLots = lots
                        .OrderBy(x => x.ExpiryDate.HasValue ? 0 : 1)
                        .ThenBy(x => x.ExpiryDate)
                        .ThenBy(x => x.CreatedAt)
                        .ToList();

                    foreach (var lot in fefoLots)
                    {
                        if (toDecrement <= 0)
                            break;

                        if (lot.QuantityRemaining <= 0)
                            continue;

                        var take = lot.QuantityRemaining >= toDecrement
                            ? toDecrement
                            : lot.QuantityRemaining;

                        lot.QuantityRemaining -= take;
                        toDecrement -= take;
                    }

                    if (toDecrement > 0)
                        throw new InvalidOperationException("allocation_impossible");
                }
                else
                {
                    var latestLot = lots
                        .OrderByDescending(x => x.CreatedAt)
                        .FirstOrDefault();

                    if (latestLot is null)
                        throw new InvalidOperationException("no_lot_for_product");

                    latestLot.QuantityRemaining += delta;
                }
            }

            inventory.Status = "POSTED";
            inventory.PostedAt = DateTime.UtcNow;
            inventory.PostedByAccountId = accountId;
            await _db.SaveChangesAsync(ct);
        }, IsolationLevel.Serializable, cancellationToken);
    }
}
