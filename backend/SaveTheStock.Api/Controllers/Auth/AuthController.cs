using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Application.Authentication.Login;
using SaveTheStock.Application.Authentication.Register;
using SaveTheStock.Api.Security;
using SaveTheStock.Application.Common.Utilities;
using SaveTheStock.Application.Options;
using Microsoft.Extensions.Options;

namespace SaveTheStock.Api.Controllers.Auth;

/// <summary>
/// Controller responsible for handling authentication-related actions,
/// such as logging in users and generating JWT tokens for authenticated sessions.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly LoginUseCase _loginUseCase;
    private readonly RegisterUseCase _registerUseCase;
    private readonly LoginProtectionService _loginProtection;
    private readonly AuthCookieService _authCookieService;
    private readonly ILogger<AuthController> _logger;
    private readonly JwtOptions _jwtOptions;

    public AuthController(
        LoginUseCase loginUseCase,
        RegisterUseCase registerUseCase,
        LoginProtectionService loginProtection,
        AuthCookieService authCookieService,
        ILogger<AuthController> logger,
        IOptions<JwtOptions> jwtOptions)
    {
        _loginUseCase = loginUseCase;
        _registerUseCase = registerUseCase;
        _loginProtection = loginProtection;
        _authCookieService = authCookieService;
        _logger = logger;
        _jwtOptions = jwtOptions.Value;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoginResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _registerUseCase.ExecuteAsync(
                new RegisterInput(
                    request.CompanyName,
                    request.OwnerDisplayName,
                    request.OwnerEmail,
                    request.Password),
                cancellationToken);

            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwtOptions.ExpiresMinutes);
            _authCookieService.AppendAuthCookies(HttpContext, result.JwtToken, expiresAt);

            _logger.LogInformation(
                "Security audit: successful registration for account {AccountId} in company {CompanyId} from IP {ClientIp}.",
                result.AccountId,
                result.CompanyId,
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");

            return Ok(new LoginResponse(
                result.JwtToken,
                result.AccountId,
                result.CompanyId,
                result.CompanyName,
                _jwtOptions.ExpiresMinutes,
                result.Role,
                result.DisplayName));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (DbUpdateException)
        {
            return BadRequest("An account with this email already exists.");
        }
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = EmailNormalizer.Normalize(request.Email);
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var attemptDecision = _loginProtection.Evaluate(normalizedEmail, clientIp);
        if (!attemptDecision.IsAllowed)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, attemptDecision.Message);
        }

        try
        {
            var result = await _loginUseCase.ExecuteAsync(
                new LoginInput(request.Email, request.Password),
                cancellationToken);

            _loginProtection.RecordSuccess(normalizedEmail, clientIp);

            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwtOptions.ExpiresMinutes);
            _authCookieService.AppendAuthCookies(HttpContext, result.JwtToken, expiresAt);

            _logger.LogInformation(
                "Security audit: successful login for account {AccountId} in company {CompanyId} from IP {ClientIp}.",
                result.AccountId,
                result.CompanyId,
                clientIp);

            return Ok(new LoginResponse(
                result.JwtToken,
                result.AccountId,
                result.CompanyId,
                result.CompanyName,
                _jwtOptions.ExpiresMinutes,
                result.Role,
                result.DisplayName));
        }
        catch (InvalidOperationException ex) when (ex.Message == "missing_credentials")
        {
            _loginProtection.RecordFailure(normalizedEmail, clientIp);
            return BadRequest("L'email et le mot de passe sont requis.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "account_not_found")
        {
            _loginProtection.RecordFailure(normalizedEmail, clientIp);
            return Unauthorized("Impossible de se connecter.");
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_password")
        {
            _loginProtection.RecordFailure(normalizedEmail, clientIp);
            return Unauthorized("Mot de passe incorrect.");
        }
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        _authCookieService.ClearAuthCookies(HttpContext);
        return NoContent();
    }
}
