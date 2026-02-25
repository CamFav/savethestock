using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveTheStock.Api.Contracts.Auth;
using SaveTheStock.Application.Authentication.Login;

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

    public AuthController(
        LoginUseCase loginUseCase)
    {
        _loginUseCase = loginUseCase;
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
