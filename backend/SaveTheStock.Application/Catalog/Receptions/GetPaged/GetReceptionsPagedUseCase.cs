using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Receptions.GetPaged;

public sealed class GetReceptionsPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetReceptionsPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetReceptionsPagedResult> ExecuteAsync(GetReceptionsPagedInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var page = input.Page <= 0 ? 1 : input.Page;
        var pageSize = input.PageSize <= 0 ? 20 : input.PageSize;

        var (items, total) = await _db.GetReceptionsPagedAsync(companyId, page, pageSize, cancellationToken);

        var mapped = items.Select(r => new ReceptionItem(
            r.Id,
            r.CompanyId,
            r.ReceptionDate,
            r.Reference,
            r.HasIssue,
            r.IssueNote,
            r.Status,
            r.AccountId,
            r.SupplierId,
            r.CreatedAt)).ToList();

        return new GetReceptionsPagedResult(mapped, page, pageSize, total);
    }
}