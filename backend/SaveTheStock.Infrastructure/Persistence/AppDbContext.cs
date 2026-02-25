using Microsoft.EntityFrameworkCore;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Application.Common.Interfaces;

namespace SaveTheStock.Infrastructure.Persistence;

/// <summary>
/// Represents the database session and provides access to all persisted entities.
/// </summary>
public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Account> Accounts => Set<Account>();

    public void AddAccount(Account account)
    {
        Accounts.Add(account);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public Task<bool> AccountEmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        return Accounts.AsNoTracking().AnyAsync(a => a.Email == normalizedEmail, cancellationToken);
    }

    public Task<Account?> FindActiveAccountByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        return Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.IsActive &&
                a.DeletedAt == null &&
                a.Email == normalizedEmail,
                cancellationToken);
    }
}
