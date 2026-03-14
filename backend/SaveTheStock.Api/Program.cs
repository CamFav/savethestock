using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SaveTheStock.Application.Common.Interfaces;
using SaveTheStock.Api.Services;
using SaveTheStock.Application.Options;
using SaveTheStock.Application.Common.Security;
using SaveTheStock.Infrastructure.Authentication;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;
using System.Text;
using SaveTheStock.Application.Accounts.InviteAccount;
using SaveTheStock.Application.Accounts.ChangeMyPassword;
using SaveTheStock.Application.Accounts.DeleteMyAccount;
using SaveTheStock.Application.Authentication.Login;
using SaveTheStock.Application.Authentication.Register;
using SaveTheStock.Application.Catalog.Categories.Create;
using SaveTheStock.Application.Catalog.Categories.GetMyListPaged;
using SaveTheStock.Application.Catalog.Categories.GetMyById;
using SaveTheStock.Application.Catalog.Categories.Update;
using SaveTheStock.Application.Catalog.Categories.Delete;
using SaveTheStock.Application.Catalog.Products.Create;
using SaveTheStock.Application.Catalog.Products.GetById;
using SaveTheStock.Application.Catalog.Products.GetPaged;
using SaveTheStock.Application.Catalog.Products.Update;
using SaveTheStock.Application.Catalog.Products.Delete;
using SaveTheStock.Application.Catalog.Lots.Create;
using SaveTheStock.Application.Catalog.Lots.GetById;
using SaveTheStock.Application.Catalog.Lots.GetPaged;
using SaveTheStock.Application.Catalog.Lots.Delete;
using SaveTheStock.Application.Catalog.Lots.Update;
using SaveTheStock.Application.Catalog.Receptions.Create;
using SaveTheStock.Application.Catalog.Receptions.GetById;
using SaveTheStock.Application.Catalog.Receptions.GetPaged;
using SaveTheStock.Application.Catalog.Receptions.Delete;
using SaveTheStock.Application.Catalog.Receptions.Update;
using SaveTheStock.Application.Directory.Suppliers.Create;
using SaveTheStock.Application.Directory.Suppliers.Delete;
using SaveTheStock.Application.Directory.Suppliers.GetById;
using SaveTheStock.Application.Directory.Suppliers.GetPaged;
using SaveTheStock.Application.Directory.Suppliers.Update;
using SaveTheStock.Application.Catalog.WasteSessions.Create;
using SaveTheStock.Application.Catalog.WasteSessions.GetById;
using SaveTheStock.Application.Catalog.WasteSessions.GetPaged;
using SaveTheStock.Application.Catalog.WasteSessions.AddLine;
using SaveTheStock.Application.Catalog.WasteSessions.UpdateLine;
using SaveTheStock.Application.Catalog.WasteSessions.RemoveLine;
using SaveTheStock.Application.Catalog.WasteSessions.Post;
using SaveTheStock.Application.Catalog.Inventories.Create;
using SaveTheStock.Application.Catalog.Inventories.GetById;
using SaveTheStock.Application.Catalog.Inventories.GetPaged;
using SaveTheStock.Application.Catalog.Inventories.UpsertLine;
using SaveTheStock.Application.Catalog.Inventories.UpdateLine;
using SaveTheStock.Application.Catalog.Inventories.RemoveLine;
using SaveTheStock.Application.Catalog.Inventories.Post;
using SaveTheStock.Application.Catalog.Dashboard;
using SaveTheStock.Application.Catalog.Operational;
using SaveTheStock.Api.Options;

var builder = WebApplication.CreateBuilder(args);

// jwt binding
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

builder.Services.AddProblemDetails();

// mvc controllers
builder.Services.AddControllers();

// registers services for swagger
builder.Services.AddEndpointsApiExplorer();

// swagger generation
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// postgresql database provider
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
           .UseSnakeCaseNamingConvention());

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();

        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.Configure<DevelopmentSeedOptions>(
    builder.Configuration.GetSection("DevSeed"));

// authentication services
builder.Services.AddScoped<SaveTheStock.Application.Authentication.IJwtTokenGenerator, SaveTheStock.Infrastructure.Authentication.JwtTokenGenerator>();
builder.Services.AddScoped<IPasswordHasher<Account>, PasswordHasher<Account>>();

builder.Services.AddScoped<IPasswordService, PasswordService>();

// http context accessor
builder.Services.AddHttpContextAccessor();

// current user accessor
builder.Services.AddScoped<ICurrentUser, CurrentUser>();


var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
          ?? throw new InvalidOperationException("Jwt section missing");

if (string.IsNullOrWhiteSpace(jwt.Issuer)) throw new InvalidOperationException("Jwt:Issuer missing");
if (string.IsNullOrWhiteSpace(jwt.Audience)) throw new InvalidOperationException("Jwt:Audience missing");
if (string.IsNullOrWhiteSpace(jwt.Secret)) throw new InvalidOperationException("Jwt:Secret missing");

// authentication configuration
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,

            ValidateAudience = true,
            ValidAudience = jwt.Audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

// authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.OwnerOnly, policy =>
        policy.RequireRole("Owner"));
});

// application services
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

// use cases
builder.Services.AddScoped<InviteAccountUseCase>();
builder.Services.AddScoped<ChangeMyPasswordUseCase>();
builder.Services.AddScoped<DeleteMyAccountUseCase>();
builder.Services.AddScoped<LoginUseCase>();
builder.Services.AddScoped<RegisterUseCase>();
// categories use cases
builder.Services.AddScoped<CreateCategoryUseCase>();
builder.Services.AddScoped<GetMyCategoriesPagedUseCase>();
builder.Services.AddScoped<GetMyCategoryByIdUseCase>();
builder.Services.AddScoped<UpdateCategoryUseCase>();
builder.Services.AddScoped<DeleteCategoryUseCase>();
// products use cases
builder.Services.AddScoped<CreateProductUseCase>();
builder.Services.AddScoped<GetProductByIdUseCase>();
builder.Services.AddScoped<GetProductsPagedUseCase>();
builder.Services.AddScoped<UpdateProductUseCase>();
builder.Services.AddScoped<DeleteProductUseCase>();
// lots use cases 
builder.Services.AddScoped<CreateLotUseCase>();
builder.Services.AddScoped<GetLotByIdUseCase>();
builder.Services.AddScoped<GetLotsPagedUseCase>();
builder.Services.AddScoped<DeleteLotUseCase>();
builder.Services.AddScoped<UpdateLotUseCase>();
// receptions use cases
builder.Services.AddScoped<CreateReceptionUseCase>();
builder.Services.AddScoped<GetReceptionByIdUseCase>();
builder.Services.AddScoped<GetReceptionsPagedUseCase>();
builder.Services.AddScoped<DeleteReceptionUseCase>();
builder.Services.AddScoped<UpdateReceptionUseCase>();
// suppliers use cases
builder.Services.AddScoped<CreateSupplierUseCase>();
builder.Services.AddScoped<GetSupplierByIdUseCase>();
builder.Services.AddScoped<GetSuppliersPagedUseCase>();
builder.Services.AddScoped<UpdateSupplierUseCase>();
builder.Services.AddScoped<DeleteSupplierUseCase>();
// waste sessions use cases
builder.Services.AddScoped<CreateWasteSessionUseCase>();
builder.Services.AddScoped<GetWasteSessionByIdUseCase>();
builder.Services.AddScoped<GetWasteSessionsPagedUseCase>();
builder.Services.AddScoped<AddWasteLineUseCase>();
builder.Services.AddScoped<UpdateWasteLineUseCase>();
builder.Services.AddScoped<RemoveWasteLineUseCase>();
builder.Services.AddScoped<PostWasteSessionUseCase>();
// inventories use cases
builder.Services.AddScoped<CreateInventoryUseCase>();
builder.Services.AddScoped<GetInventoriesPagedUseCase>();
builder.Services.AddScoped<GetInventoryByIdUseCase>();
builder.Services.AddScoped<UpsertInventoryLineUseCase>();
builder.Services.AddScoped<UpdateInventoryLineUseCase>();
builder.Services.AddScoped<RemoveInventoryLineUseCase>();
builder.Services.AddScoped<PostInventoryUseCase>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<OperationalService>();




// builds the app
var app = builder.Build();


// enable swagger in development env
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler();
    app.UseHsts();
}

app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";

    await next();
});

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

// health check point
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
   .WithName("HealthCheck");

// maps controller routes
app.MapControllers();

// starts the app
app.Run();
