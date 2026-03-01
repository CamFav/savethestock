using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Products.Delete;

/// <summary>
/// Use case for deleting  a product.
/// </summary>
public sealed class DeleteProductUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public DeleteProductUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(DeleteProductInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        var product = await _db.FindProductByIdAndCompanyIdAsync(
            input.ProductId,
            companyId.Value,
            cancellationToken);

        if (product is null)
            return;

        product.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}