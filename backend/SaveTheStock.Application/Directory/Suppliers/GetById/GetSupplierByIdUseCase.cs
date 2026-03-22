using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Directory.Suppliers.GetById;

public sealed class GetSupplierByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetSupplierByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetSupplierByIdResult> ExecuteAsync(
        GetSupplierByIdInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var supplier = await _db.FindSupplierByIdAndCompanyIdAsync(
            input.SupplierId,
            companyId,
            cancellationToken);

        if (supplier is null)
            throw new InvalidOperationException("not_found");

        return new GetSupplierByIdResult(supplier.Id, supplier.Name, supplier.Email, supplier.Phone);
    }
}
