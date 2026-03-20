using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.WasteSessions.Delete;

public sealed class DeleteWasteSessionUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteWasteSessionUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(Guid wasteSessionId, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var session = await _db.FindWasteSessionByIdAndCompanyIdAsync(wasteSessionId, companyId, cancellationToken);
        if (session is null)
            return;

        if (session.Status != "DRAFT")
            throw new InvalidOperationException("invalid_status");

        var lines = await _db.GetWasteLinesForSessionAsync(session.Id, companyId, cancellationToken);
        foreach (var line in lines)
        {
            _db.RemoveWasteLine(line);
        }

        _db.RemoveWasteSession(session);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
