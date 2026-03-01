using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Lots.Create;

public sealed class CreateLotUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateLotUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateLotResult> ExecuteAsync(CreateLotInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (input.QuantityInitial <= 0)
            throw new InvalidOperationException("invalid_quantity");

        if (input.UnitCost < 0)
            throw new InvalidOperationException("invalid_cost");

        var productExists = await _db.ProductExistsForCompanyAsync(input.ProductId, companyId, cancellationToken);
        if (!productExists)
            throw new InvalidOperationException("not_found");

        // note reception check

        var now = DateTime.UtcNow;

        var lot = new Lot
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            ProductId = input.ProductId,
            ReceptionId = input.ReceptionId,
            LotCode = string.IsNullOrWhiteSpace(input.LotCode) ? null : input.LotCode.Trim(),
            ExpiryDate = input.ExpiryDate,
            UnitCost = input.UnitCost,
            QuantityInitial = input.QuantityInitial,
            QuantityRemaining = input.QuantityInitial,
            HasIssue = false,
            IssueNote = null,
            CreatedAt = now,
            DeletedAt = null
        };

        _db.AddLot(lot);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateLotResult(
            lot.Id,
            lot.CompanyId,
            lot.ProductId,
            lot.ReceptionId,
            lot.LotCode,
            lot.ExpiryDate,
            lot.UnitCost,
            lot.QuantityInitial,
            lot.QuantityRemaining,
            lot.HasIssue,
            lot.IssueNote,
            lot.CreatedAt);
    }
}