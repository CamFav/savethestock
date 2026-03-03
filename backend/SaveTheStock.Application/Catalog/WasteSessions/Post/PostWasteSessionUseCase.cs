using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.WasteSessions.Post;

public sealed class PostWasteSessionUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public PostWasteSessionUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(PostWasteSessionInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var session = await _db.FindWasteSessionByIdAndCompanyIdAsync(input.WasteSessionId, companyId, cancellationToken);
        if (session is null)
            throw new InvalidOperationException("not_found");

        if (session.Status == "POSTED")
            throw new InvalidOperationException("already_posted");

        if (session.Status != "DRAFT")
            throw new InvalidOperationException("invalid_status");

        var lines = await _db.GetWasteLinesForSessionAsync(session.Id, companyId, cancellationToken);
        if (lines.Count == 0)
            throw new InvalidOperationException("empty_session");

        var lotsToUpdate = new Dictionary<Guid, decimal>();
        var lotsById = new Dictionary<Guid, Domain.Entities.Lot>();

        foreach (var line in lines)
        {
            if (line.Quantity <= 0)
                throw new InvalidOperationException("invalid_quantity");

            var lot = await _db.FindLotByIdAndCompanyIdAsync(line.LotId, companyId, cancellationToken);
            if (lot is null)
                throw new InvalidOperationException("not_found");

            if (lot.QuantityRemaining < line.Quantity)
                throw new InvalidOperationException("insufficient_quantity");

            lotsById[line.LotId] = lot;

            if (!lotsToUpdate.TryAdd(line.LotId, line.Quantity))
            {
                lotsToUpdate[line.LotId] += line.Quantity;
            }
        }

        foreach (var (lotId, quantity) in lotsToUpdate)
        {
            var lot = lotsById[lotId];
            lot.QuantityRemaining -= quantity;
        }

        session.Status = "POSTED";
        await _db.SaveChangesAsync(cancellationToken);
    }
}
