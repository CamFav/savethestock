using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Application.Authentication;
using SaveTheStock.Domain.Entities;
using SaveTheStock.Infrastructure.Persistence;

namespace SaveTheStock.Api.Controllers.Auth;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private const string TempPasswordPrefix = "TEMP:";

    private readonly AppDbContext _dbContext;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IPasswordHasher<Account> _passwordHasher;

    public AuthController(
        AppDbContext dbContext,
        IJwtTokenGenerator jwtTokenGenerator,
        IPasswordHasher<Account> passwordHasher)
    {
        _dbContext = dbContext;
        _jwtTokenGenerator = jwtTokenGenerator;
        _passwordHasher = passwordHasher;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email?.Trim().ToLowerInvariant();
        var password = request.Password;

        if (string.IsNullOrWhiteSpace(normalizedEmail) ||
            string.IsNullOrWhiteSpace(password))
        {
            return Unauthorized();
        }

        var account = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.IsActive &&
                a.DeletedAt == null &&
                a.Email.ToLower() == normalizedEmail,
                cancellationToken);

        if (account is null)
        {
            return Unauthorized();
        }

        var mustChangePassword = false;
        var storedPasswordHash = account.PasswordHash;

        if (string.IsNullOrWhiteSpace(storedPasswordHash))
        {
            return Unauthorized();
        }

        if (storedPasswordHash.StartsWith(TempPasswordPrefix, StringComparison.Ordinal))
        {
            mustChangePassword = true;
            storedPasswordHash = storedPasswordHash[TempPasswordPrefix.Length..];
        }

        if (string.IsNullOrWhiteSpace(storedPasswordHash))
        {
            return Unauthorized();
        }

        var passwordCheck = _passwordHasher.VerifyHashedPassword(
            account,
            storedPasswordHash,
            password);

        if (passwordCheck == PasswordVerificationResult.Failed)
        {
            return Unauthorized();
        }

        var role = account.Role.ToString();
        var (token, expiresAt) = _jwtTokenGenerator.GenerateToken(account.Id, account.CompanyId, role);

        return Ok(new LoginResponse(token, expiresAt, mustChangePassword));
    }
}
