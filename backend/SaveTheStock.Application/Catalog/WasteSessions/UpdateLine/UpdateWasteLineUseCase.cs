using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.WasteSessions.UpdateLine;

public sealed class UpdateWasteLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateWasteLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(UpdateWasteLineInput input, CancellationToken cancellationToken)
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

        var line = await _db.FindWasteLineByIdAndCompanyIdAsync(input.WasteLineId, companyId, cancellationToken);
        if (line is null || line.WasteSessionId != session.Id)
            throw new InvalidOperationException("not_found");

        line.Quantity = input.Quantity;
        line.Reason = reason;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
