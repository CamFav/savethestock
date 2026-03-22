using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Directory.Suppliers.Create;

public sealed class CreateSupplierUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public CreateSupplierUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CreateSupplierResult> ExecuteAsync(CreateSupplierInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var normalizedName = NameNormalizer.Normalize(input.Name);
        var normalizedEmail = NormalizeEmail(input.Email);
        var normalizedPhone = NormalizePhone(input.Phone);

        var exists = await _db.SupplierNameExistsAsync(companyId, normalizedName, excludeSupplierId: null, cancellationToken);
        if (exists)
            throw new InvalidOperationException("duplicate_name");

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Name = normalizedName,
            Email = normalizedEmail,
            Phone = normalizedPhone,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        _db.AddSupplier(supplier);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateSupplierResult(supplier.Id, supplier.Name, supplier.Email, supplier.Phone);
    }

    private static string? NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        return EmailNormalizer.Normalize(email);
    }

    private static string? NormalizePhone(string? phone)
    {
        var normalized = phone?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
