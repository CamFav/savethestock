using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Inventories.RemoveLine;

public sealed class RemoveInventoryLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public RemoveInventoryLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(RemoveInventoryLineInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var inventory = await _db.FindInventoryByIdAndCompanyIdAsync(input.InventoryId, companyId, cancellationToken);
        if (inventory is null)
            return;

        if (inventory.Status != "DRAFT")
            throw new InvalidOperationException("invalid_status");

        var line = await _db.FindInventoryLineByIdAndCompanyIdAsync(input.LineId, companyId, cancellationToken);
        if (line is null || line.InventoryId != inventory.Id)
            return;

        _db.RemoveInventoryLine(line);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
