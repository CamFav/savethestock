using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.WasteSessions.RemoveLine;

public sealed class RemoveWasteLineUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public RemoveWasteLineUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(RemoveWasteLineInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var session = await _db.FindWasteSessionByIdAndCompanyIdAsync(input.WasteSessionId, companyId, cancellationToken);
        if (session is null)
            return;

        if (session.Status != "DRAFT")
            throw new InvalidOperationException("invalid_status");

        var line = await _db.FindWasteLineByIdAndCompanyIdAsync(input.WasteLineId, companyId, cancellationToken);
        if (line is null || line.WasteSessionId != session.Id)
            return;

        _db.RemoveWasteLine(line);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
