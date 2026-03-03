using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

public class InventoryLineConfiguration : IEntityTypeConfiguration<InventoryLine>
{
    public void Configure(EntityTypeBuilder<InventoryLine> b)
    {
        b.ToTable("inventory_line");

        b.HasKey(x => x.Id);

        b.Property(x => x.Id).HasColumnName("id");

        b.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        b.Property(x => x.InventoryId)
            .HasColumnName("inventory_id")
            .IsRequired();

        b.Property(x => x.ProductId)
            .HasColumnName("product_id")
            .IsRequired();

        b.Property(x => x.TheoreticalQuantity)
            .HasColumnName("theoretical_quantity")
            .HasPrecision(18, 3)
            .IsRequired();

        b.Property(x => x.RealQuantity)
            .HasColumnName("real_quantity")
            .HasPrecision(18, 3)
            .IsRequired();

        b.HasOne(x => x.Inventory)
            .WithMany(x => x.Lines)
            .HasForeignKey(x => new { x.CompanyId, x.InventoryId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => new { x.CompanyId, x.ProductId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.CompanyId, x.InventoryId });
        b.HasIndex(x => new { x.CompanyId, x.ProductId });
        b.HasIndex(x => new { x.CompanyId, x.InventoryId, x.ProductId })
            .IsUnique();

        b.ToTable(t =>
        {
            t.HasCheckConstraint("ck_inventory_line_theoretical_non_negative", "theoretical_quantity >= 0");
            t.HasCheckConstraint("ck_inventory_line_real_non_negative", "real_quantity >= 0");
        });
    }
}

