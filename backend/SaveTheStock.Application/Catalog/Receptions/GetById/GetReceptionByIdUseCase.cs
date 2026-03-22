using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Receptions.GetById;

public sealed class GetReceptionByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetReceptionByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetReceptionByIdResult> ExecuteAsync(GetReceptionByIdInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var reception = await _db.FindReceptionByIdAndCompanyIdAsync(input.ReceptionId, companyId, cancellationToken);
        if (reception is null)
            throw new InvalidOperationException("not_found");

        return new GetReceptionByIdResult(
            reception.Id,
            reception.CompanyId,
            reception.ReceptionDate,
            reception.Reference,
            reception.HasIssue,
            reception.IssueNote,
            reception.Status,
            reception.AccountId,
            reception.SupplierId,
            reception.OrderId,
            reception.CreatedAt);
    }
}
