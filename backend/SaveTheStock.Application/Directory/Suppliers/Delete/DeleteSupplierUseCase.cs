using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Directory.Suppliers.Delete;

public sealed class DeleteSupplierUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteSupplierUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(DeleteSupplierInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var supplier = await _db.FindSupplierByIdAndCompanyIdAsync(
            input.SupplierId,
            companyId,
            cancellationToken);

        if (supplier is null)
            return;

        if (supplier.DeletedAt is null)
        {
            supplier.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
