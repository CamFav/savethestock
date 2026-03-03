using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> b)
    {
        b.ToTable("inventory");

        b.HasKey(x => x.Id);
        b.HasAlternateKey(x => new { x.CompanyId, x.Id });

        b.Property(x => x.Id).HasColumnName("id");

        b.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        b.Property(x => x.AccountId)
            .HasColumnName("account_id")
            .IsRequired();

        b.Property(x => x.InventoryDate)
            .HasColumnName("inventory_date")
            .IsRequired();

        b.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        b.Property(x => x.Comment)
            .HasColumnName("comment");

        b.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        b.HasMany(x => x.Lines)
            .WithOne(x => x.Inventory)
            .HasForeignKey(x => new { x.CompanyId, x.InventoryId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.CompanyId, x.InventoryDate });
        b.HasIndex(x => new { x.CompanyId, x.Status });

        b.ToTable(t =>
        {
            t.HasCheckConstraint("ck_inventory_status", "status IN ('DRAFT','POSTED','CANCELLED')");
        });
    }
}

