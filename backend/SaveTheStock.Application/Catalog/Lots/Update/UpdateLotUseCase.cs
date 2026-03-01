using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Lots.Update;

public sealed class UpdateLotUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateLotUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(UpdateLotInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (input.UnitCost < 0)
            throw new InvalidOperationException("invalid_cost");

        var lot = await _db.FindLotByIdAndCompanyIdAsync(input.LotId, companyId, cancellationToken);
        if (lot is null)
            throw new InvalidOperationException("not_found");

        if (input.ReceptionId.HasValue)
        {
            var ok = await _db.ReceptionExistsForCompanyAsync(input.ReceptionId.Value, companyId, cancellationToken);
            if (!ok)
                throw new InvalidOperationException("not_found");
        }

        lot.ReceptionId = input.ReceptionId;
        lot.LotCode = string.IsNullOrWhiteSpace(input.LotCode) ? null : input.LotCode.Trim();
        lot.ExpiryDate = input.ExpiryDate;
        lot.UnitCost = input.UnitCost;

        lot.HasIssue = input.HasIssue;
        lot.IssueNote = string.IsNullOrWhiteSpace(input.IssueNote) ? null : input.IssueNote.Trim();

        await _db.SaveChangesAsync(cancellationToken);
    }
}