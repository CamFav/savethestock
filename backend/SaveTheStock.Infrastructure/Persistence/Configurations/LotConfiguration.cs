using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

/// <summary>
/// Database mapping for the Lot entity.
/// </summary>
public sealed class LotConfiguration : IEntityTypeConfiguration<Lot>
{
    public void Configure(EntityTypeBuilder<Lot> builder)
    {
        builder.ToTable("lots");

        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.CompanyId, x.Id });

        builder.Property(x => x.CompanyId)
            .IsRequired();

        builder.Property(x => x.ProductId)
            .IsRequired();

        builder.Property(x => x.ReceptionId);

        builder.Property(x => x.LotCode)
            .HasMaxLength(100);

        builder.Property(x => x.ExpiryDate);

        builder.Property(x => x.UnitCost)
            .HasColumnType("numeric")
            .IsRequired();

        builder.Property(x => x.QuantityInitial)
            .HasColumnType("numeric")
            .IsRequired();

        builder.Property(x => x.QuantityRemaining)
            .HasColumnType("numeric")
            .IsRequired();

        builder.Property(x => x.HasIssue)
            .IsRequired();

        builder.Property(x => x.IssueNote);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.DeletedAt);

        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.HasIndex(x => x.CompanyId);

        builder.HasIndex(x => new { x.CompanyId, x.ProductId });

        builder.HasIndex(x => new { x.CompanyId, x.ReceptionId });

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => new { x.CompanyId, x.ProductId })
            .HasPrincipalKey(p => new { p.CompanyId, p.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Reception>()
            .WithMany()
            .HasForeignKey(l => new { l.CompanyId, l.ReceptionId })
            .HasPrincipalKey(r => new { r.CompanyId, r.Id })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}