using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

public sealed class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> builder)
    {
        builder.ToTable("order_line");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        builder.Property(x => x.OrderId)
            .HasColumnName("order_id")
            .IsRequired();

        builder.Property(x => x.ProductId)
            .HasColumnName("product_id")
            .IsRequired();

        builder.Property(x => x.ProductName)
            .HasColumnName("product_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Unit)
            .HasColumnName("unit")
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.QuantityOrdered)
            .HasColumnName("quantity_ordered")
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.QuantityReceived)
            .HasColumnName("quantity_received")
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.UnitPrice)
            .HasColumnName("unit_price")
            .HasPrecision(18, 2);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => new { x.CompanyId, x.ProductId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.CompanyId, x.OrderId });
        builder.HasIndex(x => new { x.CompanyId, x.ProductId });
        builder.HasIndex(x => new { x.CompanyId, x.OrderId, x.ProductId }).IsUnique();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_order_line_quantity_ordered_positive", "quantity_ordered > 0");
            t.HasCheckConstraint("ck_order_line_quantity_received_non_negative", "quantity_received >= 0");
        });
    }
}
