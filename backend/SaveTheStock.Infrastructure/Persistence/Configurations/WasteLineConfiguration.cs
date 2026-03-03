using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

public class WasteLineConfiguration : IEntityTypeConfiguration<WasteLine>
{
    public void Configure(EntityTypeBuilder<WasteLine> b)
    {
        b.ToTable("waste_line");

        b.HasKey(x => x.Id);

        b.Property(x => x.Id).HasColumnName("id");

        b.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        b.Property(x => x.WasteSessionId)
            .HasColumnName("waste_session_id")
            .IsRequired();

        b.Property(x => x.LotId)
            .HasColumnName("lot_id")
            .IsRequired();

        b.Property(x => x.Quantity)
            .HasColumnName("quantity")
            .HasPrecision(18, 3)
            .IsRequired();

        b.Property(x => x.Reason)
            .HasColumnName("reason")
            .HasMaxLength(255)
            .IsRequired();

        b.HasOne(x => x.WasteSession)
            .WithMany(x => x.Lines)
            .HasForeignKey(x => new { x.CompanyId, x.WasteSessionId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Lot)
            .WithMany()
            .HasForeignKey(x => new { x.CompanyId, x.LotId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.CompanyId, x.WasteSessionId });
        b.HasIndex(x => new { x.CompanyId, x.LotId });

        b.ToTable(t =>
        {
            t.HasCheckConstraint("ck_waste_line_quantity_positive", "quantity > 0");
            t.HasCheckConstraint("ck_waste_line_reason_not_empty", "length(trim(reason)) > 0");
        });
    }
}