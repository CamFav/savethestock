using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SaveTheStock.Application.Common.Security;
using SaveTheStock.Application.Options;
using SaveTheStock.Application.Authentication;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SaveTheStock.Infrastructure.Authentication;

/// <summary>
/// Implements the IJwtTokenGenerator interface to generate JWT tokens for authenticated users.
/// </summary>
public sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtOptions _jwt;

    /// <summary>
    /// Initializes a new instance of the JwtTokenGenerator class with the specified JWT options.
    /// </summary>
    public JwtTokenGenerator(IOptions<JwtOptions> jwtOptions)
    {
        _jwt = jwtOptions.Value;
    }

    /// <summary>
    /// Generates a JWT token containing claims for the specified account ID, company ID, and role.
    /// </summary>
    /// <returns>A tuple containing the generated JWT token and its expiration date/time. </returns>
    public (string Token, DateTimeOffset ExpiresAt) GenerateToken(Guid accountId, Guid companyId, string role)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwt.ExpiresMinutes);

        var claims = new List<Claim>
        {
            new(CustomClaimTypes.AccountId, accountId.ToString()),
            new(CustomClaimTypes.CompanyId, companyId.ToString()),
            new(ClaimTypes.Role, role)
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return (tokenString, expiresAt);
    }
}
