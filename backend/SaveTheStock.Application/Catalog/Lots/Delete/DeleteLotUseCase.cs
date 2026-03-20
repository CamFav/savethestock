using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Lots.Delete;

public sealed class DeleteLotUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteLotUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var lot = await _db.FindLotByIdAndCompanyIdAsync(lotId, companyId, cancellationToken);

        if (lot is null)
            return;

        lot.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}