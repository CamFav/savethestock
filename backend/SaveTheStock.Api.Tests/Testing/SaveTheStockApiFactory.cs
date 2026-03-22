using System;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SaveTheStock.Infrastructure.Persistence;

namespace SaveTheStock.Api.Tests.Testing;

/// <summary>
/// Integration testing & replaces PostgreSQL with an InMemory database.
/// </summary>
public sealed class SaveTheStockApiFactory : WebApplicationFactory<SaveTheStock.Api.Program>
{
    private readonly string _dbName = $"SaveTheStock_TestDb_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        var contentRoot = ResolveApiContentRoot();
        builder.UseContentRoot(contentRoot);

        builder.ConfigureServices(services =>
        {
            // Remove existing AppDbContext registrations
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            // Create a dedicated internal service provider for EF Core.
            var inMemoryProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            services.AddDbContext<AppDbContext>(options =>
            {
                // note : constant DB name per factory instance (not per request)
                options.UseInMemoryDatabase(_dbName);
                options.UseInternalServiceProvider(inMemoryProvider);
            });
        });
    }

    private static string ResolveApiContentRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);

        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "SaveTheStock.Api");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Unable to locate the SaveTheStock.Api content root for integration tests.");
    }
}
