using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaveTheStock.Domain.Entities;

namespace SaveTheStock.Infrastructure.Persistence.Configurations;

/// <summary>
/// Database mapping for the Product entity.
/// Includes table name, primary key, required fields, constraints, indexes, and relationships.
/// </summary>
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(x => x.Id);
        

        builder.Property(x => x.CompanyId)
            .IsRequired();

        builder.Property(x => x.CategoryId)
            .IsRequired();

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Unit)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.AlertThreshold)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.DeletedAt);

        builder.HasIndex(x => x.CompanyId);

        builder.HasIndex(x => new { x.CompanyId, x.CategoryId });

        builder.HasIndex(x => new { x.CompanyId, x.Name })
            .IsUnique()
            .HasFilter("deleted_at IS NULL");

        builder.HasQueryFilter(x => x.DeletedAt == null);

        builder.HasOne(x => x.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(x => new { x.CompanyId, x.CategoryId })
            .HasPrincipalKey(c => new { c.CompanyId, c.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}