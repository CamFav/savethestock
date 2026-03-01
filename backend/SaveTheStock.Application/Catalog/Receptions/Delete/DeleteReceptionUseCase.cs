using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Receptions.Delete;

public sealed class DeleteReceptionUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteReceptionUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(Guid receptionId, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var reception = await _db.FindReceptionByIdAndCompanyIdAsync(receptionId, companyId, cancellationToken);

        if (reception is null)
            return; // idempotent

        reception.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}