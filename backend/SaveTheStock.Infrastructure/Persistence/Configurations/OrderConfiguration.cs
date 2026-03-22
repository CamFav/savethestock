using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.CompanyId, x.Id });

        builder.Property(x => x.CompanyId).IsRequired();

        builder.Property(x => x.Reference)
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(x => x.OrderDate).IsRequired();

        builder.Property(x => x.SupplierId);

        builder.Property(x => x.Status)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Notes);

        builder.Property(x => x.AccountId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => new { x.CompanyId, x.Status });
        builder.HasIndex(x => new { x.CompanyId, x.OrderDate });
        builder.HasIndex(x => new { x.CompanyId, x.Reference }).IsUnique();

        builder.HasOne(x => x.Account)
            .WithMany()
            .HasForeignKey(x => new { x.CompanyId, x.AccountId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => new { x.CompanyId, x.SupplierId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Lines)
            .WithOne(x => x.Order)
            .HasForeignKey(x => new { x.CompanyId, x.OrderId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "ck_orders_status",
                "status in ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')");
        });
    }
}
