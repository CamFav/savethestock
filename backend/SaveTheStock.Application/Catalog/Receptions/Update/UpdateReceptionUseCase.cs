using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Receptions.Update;

public sealed class UpdateReceptionUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public UpdateReceptionUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(UpdateReceptionInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var reception = await _db.FindReceptionByIdAndCompanyIdAsync(input.ReceptionId, companyId, cancellationToken);
        if (reception is null)
            throw new InvalidOperationException("not_found");


        reception.ReceptionDate = input.ReceptionDate;
        reception.Reference = string.IsNullOrWhiteSpace(input.Reference) ? null : input.Reference.Trim();
        reception.HasIssue = input.HasIssue;
        reception.IssueNote = string.IsNullOrWhiteSpace(input.IssueNote) ? null : input.IssueNote.Trim();
        reception.SupplierId = input.SupplierId;

        await _db.SaveChangesAsync(cancellationToken);
    }
}