using SaveTheStock.Application.Catalog.Orders.Common;
using SaveTheStock.Application.Catalog.Orders.CreateDraft;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Application.Catalog.Orders.AddToDraft;

public sealed class AddProductToDraftOrderUseCase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly CreateDraftOrderUseCase _createDraftOrder;

    public AddProductToDraftOrderUseCase(
        IAppDbContext db,
        ICurrentUser currentUser,
        CreateDraftOrderUseCase createDraftOrder)
    {
        _db = db;
        _currentUser = currentUser;
        _createDraftOrder = createDraftOrder;
    }

    public async Task<OrderView> ExecuteAsync(AddProductToDraftOrderInput input, CancellationToken cancellationToken)
    {
        var companyId = _currentUser.CompanyId ?? throw new UnauthorizedAccessException();

        var product = await _db.FindProductByIdAndCompanyIdAsync(input.ProductId, companyId, cancellationToken);
        if (product is null)
        {
            throw new InvalidOperationException("product_not_found");
        }

        var draftOrder = await _db.FindDraftOrderByCompanyIdAsync(companyId, cancellationToken);
        if (draftOrder is null)
        {
            var createdDraft = await _createDraftOrder.ExecuteAsync(cancellationToken);
            draftOrder = await _db.FindOrderByIdAndCompanyIdForUpdateAsync(createdDraft.Id, companyId, cancellationToken);
        }

        if (draftOrder is null)
        {
            throw new InvalidOperationException("not_found");
        }

        var quantity = input.Quantity.GetValueOrDefault(1m);
        if (quantity <= 0)
        {
            quantity = 1m;
        }

        var existingLine = draftOrder.Lines.FirstOrDefault(line => line.ProductId == product.Id);
        if (existingLine is not null)
        {
            existingLine.QuantityOrdered += quantity;
            existingLine.UnitPrice = input.UnitPrice ?? existingLine.UnitPrice;
        }
        else
        {
            draftOrder.Lines.Add(new OrderLine
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                OrderId = draftOrder.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                Unit = product.Unit,
                QuantityOrdered = quantity,
                QuantityReceived = 0m,
                UnitPrice = input.UnitPrice
            });
        }

        draftOrder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return OrderMappings.ToView(draftOrder);
    }
}
