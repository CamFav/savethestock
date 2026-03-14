using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.WasteSessions.GetById;

public sealed class GetWasteSessionByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetWasteSessionByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetWasteSessionByIdResult> ExecuteAsync(
        GetWasteSessionByIdInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var session = await _db.FindWasteSessionReadModelByIdAndCompanyIdAsync(
            input.WasteSessionId,
            companyId,
            cancellationToken);

        if (session is null)
            throw new InvalidOperationException("not_found");

        var lines = await _db.GetWasteLinesForSessionAsync(
            session.Id,
            companyId,
            cancellationToken);

        var mapped = lines.Select(x => new WasteLineResult(
            x.Id,
            x.CompanyId,
            x.WasteSessionId,
            x.LotId,
            x.Quantity,
            x.Reason)).ToList();

        return new GetWasteSessionByIdResult(
            session.Id,
            session.CompanyId,
            session.AccountId,
            session.WasteDate,
            session.Status,
            session.Comment,
            session.CreatedAt,
            session.PostedByName,
            mapped);
    }
}
