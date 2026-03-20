using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Companies.Delete;

public sealed class DeleteCompanyUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteCompanyUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException("Missing company_id claim.");

        await _db.DeleteCompanyDataAsync(companyId.Value, cancellationToken);
    }
}
