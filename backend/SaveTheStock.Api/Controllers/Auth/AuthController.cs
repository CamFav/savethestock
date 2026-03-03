using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Application.Authentication.Login;
using SaveTheStock.Application.Authentication.Register;

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

    public AuthController(
        LoginUseCase loginUseCase,
        RegisterUseCase registerUseCase)
    {
        _loginUseCase = loginUseCase;
        _registerUseCase = registerUseCase;
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

            return Ok(new LoginResponse(
                result.JwtToken,
                result.AccountId,
                result.CompanyId,
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
        try
        {
            var result = await _loginUseCase.ExecuteAsync(
                new LoginInput(request.Email, request.Password),
                cancellationToken);

            return Ok(new LoginResponse(
                result.JwtToken,
                result.AccountId,
                result.CompanyId,
                result.Role,
                result.DisplayName));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }
}
