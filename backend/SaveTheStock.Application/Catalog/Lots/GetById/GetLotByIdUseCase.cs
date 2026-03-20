using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Lots.GetById;

public sealed class GetLotByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetLotByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetLotByIdResult> ExecuteAsync(GetLotByIdInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var lot = await _db.FindLotByIdAndCompanyIdAsync(input.LotId, companyId, cancellationToken);
        if (lot is null)
            throw new InvalidOperationException("not_found");

        return new GetLotByIdResult(
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