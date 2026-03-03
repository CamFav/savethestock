using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.WasteSessions.Create;

public sealed class CreateWasteSessionUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateWasteSessionUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateWasteSessionResult> ExecuteAsync(
        CreateWasteSessionInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();
        var accountId = _currentUser.AccountId ?? throw new UnauthorizedAccessException();

        var comment = string.IsNullOrWhiteSpace(input.Comment) ? null : input.Comment.Trim();

        var session = new WasteSession
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            AccountId = accountId,
            WasteDate = input.WasteDate,
            Status = "DRAFT",
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };

        _db.AddWasteSession(session);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateWasteSessionResult(
            session.Id,
            session.CompanyId,
            session.AccountId,
            session.WasteDate,
            session.Status,
            session.Comment,
            session.CreatedAt);
    }
}
