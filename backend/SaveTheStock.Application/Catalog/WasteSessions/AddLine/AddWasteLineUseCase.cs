using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.WasteSessions.AddLine;

public sealed class AddWasteLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public AddWasteLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<AddWasteLineResult> ExecuteAsync(AddWasteLineInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        if (input.Quantity <= 0)
            throw new InvalidOperationException("invalid_quantity");

        var reason = input.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            throw new InvalidOperationException("invalid_reason");

        var session = await _db.FindWasteSessionByIdAndCompanyIdAsync(input.WasteSessionId, companyId, cancellationToken);
        if (session is null)
            throw new InvalidOperationException("not_found");

        if (session.Status != "DRAFT")
            throw new InvalidOperationException("invalid_status");

        var lot = await _db.FindLotByIdAndCompanyIdAsync(input.LotId, companyId, cancellationToken);
        if (lot is null)
            throw new InvalidOperationException("not_found");

        var existing = await _db.GetWasteLinesForSessionAsync(session.Id, companyId, cancellationToken);
        if (existing.Any(x => x.LotId == input.LotId))
            throw new InvalidOperationException("duplicate_lot");

        var line = new WasteLine
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            WasteSessionId = session.Id,
            LotId = input.LotId,
            Quantity = input.Quantity,
            Reason = reason
        };

        _db.AddWasteLine(line);
        await _db.SaveChangesAsync(cancellationToken);

        return new AddWasteLineResult(
            line.Id,
            line.CompanyId,
            line.WasteSessionId,
            line.LotId,
            line.Quantity,
            line.Reason);
    }
}
