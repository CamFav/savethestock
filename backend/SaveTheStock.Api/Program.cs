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
using SaveTheStock.Application.Catalog.Categories.Create;
using SaveTheStock.Application.Catalog.Categories.GetMyListPaged;
using SaveTheStock.Application.Catalog.Categories.GetMyById;

var builder = WebApplication.CreateBuilder(args);

// jwt binding
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

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

// authentication services
builder.Services.AddScoped<SaveTheStock.Application.Authentication.IJwtTokenGenerator, SaveTheStock.Infrastructure.Authentication.JwtTokenGenerator>();
builder.Services.AddScoped<IPasswordHasher<Account>, PasswordHasher<Account>>();

builder.Services.AddScoped<IPasswordService, PasswordService>();

// http context accessor
builder.Services.AddHttpContextAccessor();

// current user accessor
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// use cases
builder.Services.AddScoped<CreateCategoryUseCase>();

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
builder.Services.AddScoped<GetMyCategoriesPagedUseCase>();
builder.Services.AddScoped<GetMyCategoryByIdUseCase>();

// builds the app
var app = builder.Build();


// enable swagger in development env
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

// health check point
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
   .WithName("HealthCheck");

// maps controller routes
app.MapControllers();

// starts the app
app.Run();
