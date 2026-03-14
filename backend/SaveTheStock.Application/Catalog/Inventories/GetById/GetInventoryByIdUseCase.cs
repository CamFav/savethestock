using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Inventories.GetById;

public sealed class GetInventoryByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetInventoryByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetInventoryByIdResult> ExecuteAsync(
        GetInventoryByIdInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var inventory = await _db.FindInventoryReadModelByIdAndCompanyIdAsync(
            input.InventoryId,
            companyId,
            cancellationToken);

        if (inventory is null)
            throw new InvalidOperationException("not_found");

        var lines = await _db.GetInventoryLinesAsync(companyId, inventory.Id, cancellationToken);

        var mappedLines = lines.Select(x => new InventoryLineResult(
            x.Id,
            x.CompanyId,
            x.InventoryId,
            x.ProductId,
            x.TheoreticalQuantity,
            x.RealQuantity)).ToList();

        return new GetInventoryByIdResult(
            inventory.Id,
            inventory.CompanyId,
            inventory.AccountId,
            inventory.InventoryDate,
            inventory.Status,
            inventory.Comment,
            inventory.CreatedAt,
            inventory.PostedByName,
            mappedLines);
    }
}
