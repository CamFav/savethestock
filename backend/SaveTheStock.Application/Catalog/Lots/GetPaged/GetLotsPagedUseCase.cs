using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Lots.GetPaged;

public sealed class GetLotsPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetLotsPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetLotsPagedResult> ExecuteAsync(GetLotsPagedInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var page = input.Page <= 0 ? 1 : input.Page;
        var pageSize = input.PageSize <= 0 ? 20 : input.PageSize;

        var (items, total) = await _db.GetLotsPagedAsync(
            companyId,
            input.ProductId,
            input.ReceptionId,
            page,
            pageSize,
            cancellationToken);

        var mapped = items.Select(l => new LotItem(
            l.Id,
            l.CompanyId,
            l.ProductId,
            l.ReceptionId,
            l.LotCode,
            l.ExpiryDate,
            l.UnitCost,
            l.QuantityInitial,
            l.QuantityRemaining,
            l.HasIssue,
            l.IssueNote,
            l.CreatedAt)).ToList();

        return new GetLotsPagedResult(mapped, page, pageSize, total);
    }
}