using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Directory.Suppliers.GetPaged;

public sealed class GetSuppliersPagedUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetSuppliersPagedUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetSuppliersPagedResult> ExecuteAsync(
        GetSuppliersPagedInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var page = input.Page < 1 ? 1 : input.Page;
        var pageSize = input.PageSize < 1 ? 20 : input.PageSize;

        var (items, total) = await _db.GetSuppliersPagedAsync(
            companyId,
            page,
            pageSize,
            cancellationToken);

        var mapped = items
            .Select(s => new GetSuppliersPagedItem(s.Id, s.Name, s.Email, s.Phone))
            .ToList()
            .AsReadOnly();

        return new GetSuppliersPagedResult(mapped, page, pageSize, total);
    }
}
