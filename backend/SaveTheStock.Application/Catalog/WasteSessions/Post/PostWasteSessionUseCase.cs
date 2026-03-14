using SaveTheStock.Application.Common.Interfaces;
using System.Data;

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
        var accountId = _currentUser.AccountId ?? throw new UnauthorizedAccessException();

        // Serializable + row-level locks ensure that concurrent POST requests cannot
        // double-apply stock decrements for the same session/lots.
        await _db.ExecuteInTransactionAsync(async ct =>
        {
            var session = await _db.FindWasteSessionByIdAndCompanyIdForUpdateAsync(input.WasteSessionId, companyId, ct);
            if (session is null)
                throw new InvalidOperationException("not_found");

            if (session.Status == "POSTED")
                throw new InvalidOperationException("already_posted");

            if (session.Status != "DRAFT")
                throw new InvalidOperationException("invalid_status");

            var lines = await _db.GetWasteLinesForSessionAsync(session.Id, companyId, ct);
            if (lines.Count == 0)
                throw new InvalidOperationException("empty_session");

            var lotsToUpdate = new Dictionary<Guid, decimal>();
            foreach (var line in lines)
            {
                if (line.Quantity <= 0)
                    throw new InvalidOperationException("invalid_quantity");

                if (!lotsToUpdate.TryAdd(line.LotId, line.Quantity))
                {
                    lotsToUpdate[line.LotId] += line.Quantity;
                }
            }

            var lockedLots = await _db.GetLotsByIdsForUpdateAsync(companyId, lotsToUpdate.Keys.ToArray(), ct);
            var lotsById = lockedLots.ToDictionary(x => x.Id, x => x);

            foreach (var (lotId, quantity) in lotsToUpdate)
            {
                if (!lotsById.TryGetValue(lotId, out var lot))
                    throw new InvalidOperationException("not_found");

                if (quantity > lot.QuantityRemaining)
                    throw new InvalidOperationException("insufficient_quantity");

                lot.QuantityRemaining -= quantity;
            }

            session.Status = "POSTED";
            session.PostedAt = DateTime.UtcNow;
            session.PostedByAccountId = accountId;
            await _db.SaveChangesAsync(ct);
        }, IsolationLevel.Serializable, cancellationToken);
    }
}
