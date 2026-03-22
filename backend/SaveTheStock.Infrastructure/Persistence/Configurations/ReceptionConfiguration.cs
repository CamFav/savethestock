using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

public sealed class ReceptionConfiguration : IEntityTypeConfiguration<Reception>
{
    public void Configure(EntityTypeBuilder<Reception> builder)
    {
        builder.ToTable("receptions");

        builder.HasKey(x => x.Id);

        builder.HasAlternateKey(x => new { x.CompanyId, x.Id });

        builder.Property(x => x.CompanyId).IsRequired();
        builder.Property(x => x.ReceptionDate).IsRequired();

        builder.Property(x => x.Reference).HasMaxLength(100);

        builder.Property(x => x.HasIssue).IsRequired();
        builder.Property(x => x.IssueNote);

        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();

        builder.Property(x => x.AccountId).IsRequired();
        builder.Property(x => x.SupplierId);
        builder.Property(x => x.OrderId);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.DeletedAt);

        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.HasIndex(x => x.CompanyId);
        builder.HasIndex(x => new { x.CompanyId, x.ReceptionDate });
        builder.HasIndex(x => new { x.CompanyId, x.OrderId });

        builder.HasOne(x => x.Account)
            .WithMany()
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Order)
            .WithMany(x => x.Receptions)
            .HasForeignKey(x => new { x.CompanyId, x.OrderId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
