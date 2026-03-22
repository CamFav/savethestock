using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Receptions.Create;

public sealed class CreateReceptionUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateReceptionUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateReceptionResult> ExecuteAsync(CreateReceptionInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();
        var accountId = _currentUser.AccountId ?? throw new UnauthorizedAccessException();


        var now = DateTime.UtcNow;

        var reception = new Reception
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            ReceptionDate = input.ReceptionDate,
            Reference = string.IsNullOrWhiteSpace(input.Reference) ? null : input.Reference.Trim(),
            HasIssue = input.HasIssue,
            IssueNote = string.IsNullOrWhiteSpace(input.IssueNote) ? null : input.IssueNote.Trim(),
            Status = "Draft",
            AccountId = accountId,
            SupplierId = input.SupplierId,
            OrderId = null,
            CreatedAt = now,
            DeletedAt = null
        };

        _db.AddReception(reception);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateReceptionResult(
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
