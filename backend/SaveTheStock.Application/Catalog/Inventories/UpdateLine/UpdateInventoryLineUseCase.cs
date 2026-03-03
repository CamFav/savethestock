using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Inventories.UpdateLine;

public sealed class UpdateInventoryLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateInventoryLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(UpdateInventoryLineInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (input.RealQuantity < 0)
            throw new InvalidOperationException("invalid_quantity");

        var inventory = await _db.FindInventoryByIdAndCompanyIdAsync(input.InventoryId, companyId, cancellationToken);
        if (inventory is null)
            throw new InvalidOperationException("not_found");

        if (inventory.Status != "DRAFT")
            throw new InvalidOperationException("invalid_status");

        var line = await _db.FindInventoryLineByIdAndCompanyIdAsync(input.LineId, companyId, cancellationToken);
        if (line is null || line.InventoryId != inventory.Id)
            throw new InvalidOperationException("not_found");

        line.RealQuantity = input.RealQuantity;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
