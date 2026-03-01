using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Application.Catalog.Products.GetById;

/// <summary>
/// Use case for retrieving a product by id.
/// </summary>
public sealed class GetProductByIdUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;

    public GetProductByIdUseCase(IAppDbContext db, ICurrentUser currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<GetProductByIdResult> ExecuteAsync(
        GetProductByIdInput input,
        CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId;
        if (companyId is null)
            throw new UnauthorizedAccessException();

        var product = await _db.FindProductByIdAndCompanyIdAsync(
            input.ProductId,
            companyId.Value,
            cancellationToken);

        if (product is null)
            throw new InvalidOperationException("not_found");

        return new GetProductByIdResult(
            product.Id,
            product.CompanyId,
            product.CategoryId,
            product.Name,
            product.Unit,
            product.AlertThreshold,
            product.IsActive,
            product.CreatedAt);
    }
}