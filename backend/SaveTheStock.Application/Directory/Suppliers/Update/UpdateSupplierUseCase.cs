using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;

namespace SaveTheStock.Application.Directory.Suppliers.Update;

public sealed class UpdateSupplierUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateSupplierUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(UpdateSupplierInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var supplier = await _db.FindSupplierByIdAndCompanyIdAsync(
            input.SupplierId,
            companyId,
            cancellationToken);

        if (supplier is null)
            throw new InvalidOperationException("not_found");

        var normalizedName = NameNormalizer.Normalize(input.Name);

        var exists = await _db.SupplierNameExistsAsync(
            companyId,
            normalizedName,
            excludeSupplierId: input.SupplierId,
            cancellationToken);

        if (exists)
            throw new InvalidOperationException("duplicate_name");

        supplier.Name = normalizedName;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
