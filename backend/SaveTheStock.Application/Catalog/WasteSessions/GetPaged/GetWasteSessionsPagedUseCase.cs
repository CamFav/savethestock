using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.WasteSessions.GetPaged;

public sealed class GetWasteSessionsPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetWasteSessionsPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetWasteSessionsPagedResult> ExecuteAsync(
        GetWasteSessionsPagedInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var page = input.Page <= 0 ? 1 : input.Page;
        var pageSize = input.PageSize <= 0 ? 20 : input.PageSize;

        var (items, total) = await _db.GetWasteSessionReadModelsPagedAsync(
            companyId,
            input.From,
            input.To,
            input.Status,
            page,
            pageSize,
            cancellationToken);

        var mapped = items.Select(x => new WasteSessionItem(
            x.Id,
            x.CompanyId,
            x.AccountId,
            x.WasteDate,
            x.Status,
            x.Comment,
            x.CreatedAt,
            x.PostedByName)).ToList();

        return new GetWasteSessionsPagedResult(mapped, page, pageSize, total);
    }
}
