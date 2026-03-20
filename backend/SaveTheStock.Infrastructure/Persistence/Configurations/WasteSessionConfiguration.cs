using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

public class WasteSessionConfiguration : IEntityTypeConfiguration<WasteSession>
{
    public void Configure(EntityTypeBuilder<WasteSession> b)
    {
        b.ToTable("waste_session");

        b.HasKey(x => x.Id);

        b.HasAlternateKey(x => new { x.CompanyId, x.Id });

        b.Property(x => x.Id).HasColumnName("id");

        b.Property(x => x.CompanyId)
            .HasColumnName("company_id")
            .IsRequired();

        b.Property(x => x.AccountId)
            .HasColumnName("account_id")
            .IsRequired();

        b.Property(x => x.WasteDate)
            .HasColumnName("waste_date")
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

        b.Property(x => x.PostedAt)
            .HasColumnName("posted_at");

        b.Property(x => x.PostedByAccountId)
            .HasColumnName("posted_by_account_id");

        b.HasMany(x => x.Lines)
            .WithOne(x => x.WasteSession)
            .HasForeignKey(x => new { x.CompanyId, x.WasteSessionId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.CompanyId, x.WasteDate });
        b.HasIndex(x => new { x.CompanyId, x.Status });
    }
}
