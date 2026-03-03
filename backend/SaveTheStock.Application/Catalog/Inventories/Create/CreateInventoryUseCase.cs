using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Inventories.Create;

public sealed class CreateInventoryUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateInventoryUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateInventoryResult> ExecuteAsync(
        CreateInventoryInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();
        var accountId = _currentUser.AccountId ?? throw new UnauthorizedAccessException();

        var comment = string.IsNullOrWhiteSpace(input.Comment) ? null : input.Comment.Trim();

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            AccountId = accountId,
            InventoryDate = input.InventoryDate,
            Status = "DRAFT",
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };

        _db.AddInventory(inventory);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateInventoryResult(
            inventory.Id,
            inventory.CompanyId,
            inventory.AccountId,
            inventory.InventoryDate,
            inventory.Status,
            inventory.Comment,
            inventory.CreatedAt);
    }
}
