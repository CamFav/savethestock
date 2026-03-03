using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SaveTheStock.Api.Options;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;

namespace SaveTheStock.Api.Services.Seeding;

public sealed class DevelopmentSeedHostedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHostEnvironment _hostEnvironment;
    private readonly IOptions<DevelopmentSeedOptions> _options;
    private readonly ILogger<DevelopmentSeedHostedService> _logger;

    public DevelopmentSeedHostedService(
        IServiceProvider serviceProvider,
        IHostEnvironment hostEnvironment,
        IOptions<DevelopmentSeedOptions> options,
        ILogger<DevelopmentSeedHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _hostEnvironment = hostEnvironment;
        _options = options;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_hostEnvironment.IsDevelopment())
            return;

        var options = _options.Value;
        if (!options.Enabled)
            return;

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwords = scope.ServiceProvider.GetRequiredService<IPasswordService>();

        var hasAnyCompany = await db.Companies.AsNoTracking().AnyAsync(cancellationToken);
        var hasAnyAccount = await db.Accounts.AsNoTracking().AnyAsync(cancellationToken);

        if (hasAnyCompany || hasAnyAccount)
        {
            _logger.LogInformation("Seed skipped because data already exists.");
            return;
        }

        var companyName = options.CompanyName.Trim();
        var displayName = options.OwnerDisplayName.Trim();
        var normalizedEmail = EmailNormalizer.Normalize(options.OwnerEmail);

        if (string.IsNullOrWhiteSpace(companyName) ||
            string.IsNullOrWhiteSpace(displayName) ||
            string.IsNullOrWhiteSpace(normalizedEmail) ||
            string.IsNullOrWhiteSpace(options.OwnerPassword))
        {
            _logger.LogWarning("Seed skipped because configuration is invalid.");
            return;
        }

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = companyName,
            CreatedAt = DateTime.UtcNow
        };

        var owner = new Account
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Email = normalizedEmail,
            DisplayName = displayName,
            Role = "Owner",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        owner.PasswordHash = passwords.HashPassword(owner, options.OwnerPassword);

        db.Companies.Add(company);
        db.Accounts.Add(owner);
        await db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seed created company {CompanyId} and owner account {AccountId}.", company.Id, owner.Id);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
