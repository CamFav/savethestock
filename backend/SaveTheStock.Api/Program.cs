using Microsoft.EntityFrameworkCore;
using SaveTheStock.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// mvc controllers
builder.Services.AddControllers();

// registers services for swagger
builder.Services.AddEndpointsApiExplorer();

// swagger generation
builder.Services.AddSwaggerGen();

// postgresql database provider
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// builds the app
var app = builder.Build();


// enable swagger in development env
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// health check point
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
   .WithName("HealthCheck")
   .WithOpenApi();

// maps controller routes
app.MapControllers();

// starts the app
app.Run();
