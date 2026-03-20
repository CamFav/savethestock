using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Inventories.UpsertLine;

public sealed class UpsertInventoryLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpsertInventoryLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UpsertInventoryLineResult> ExecuteAsync(
        UpsertInventoryLineInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (input.RealQuantity < 0)
            throw new InvalidOperationException("invalid_quantity");

        var inventory = await _db.FindInventoryByIdAndCompanyIdAsync(input.InventoryId, companyId, cancellationToken);
        if (inventory is null)
            throw new InvalidOperationException("not_found");

        if (inventory.Status != "DRAFT")
            throw new InvalidOperationException("invalid_status");

        var product = await _db.FindProductByIdAndCompanyIdAsync(input.ProductId, companyId, cancellationToken);
        if (product is null)
            throw new InvalidOperationException("not_found");

        if (!product.IsActive)
            throw new InvalidOperationException("inactive_product");

        var line = await _db.FindInventoryLineByInventoryAndProductAsync(
            companyId,
            inventory.Id,
            input.ProductId,
            cancellationToken);

        if (line is null)
        {
            line = new InventoryLine
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                InventoryId = inventory.Id,
                ProductId = input.ProductId,
                TheoreticalQuantity = 0m,
                RealQuantity = input.RealQuantity
            };

            _db.AddInventoryLine(line);
        }
        else
        {
            line.RealQuantity = input.RealQuantity;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new UpsertInventoryLineResult(
            line.Id,
            line.CompanyId,
            line.InventoryId,
            line.ProductId,
            line.TheoreticalQuantity,
            line.RealQuantity);
    }
}
