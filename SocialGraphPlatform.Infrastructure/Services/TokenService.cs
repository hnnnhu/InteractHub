using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SocialGraphPlatform.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly string _secretKey;
    private readonly int _accessTokenExpiryMinutes;
    private readonly int _refreshTokenExpiryDays;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;

        var jwtSection = _configuration.GetSection("JwtSettings");
        _issuer = jwtSection["Issuer"] ?? "SocialGraphPlatform";
        _audience = jwtSection["Audience"] ?? "SocialGraphPlatform";
        _secretKey = jwtSection["Secret"]
                    ?? throw new InvalidOperationException("JwtSettings:Secret is required in appsettings.json");
        _accessTokenExpiryMinutes = int.Parse(jwtSection["AccessTokenExpiryMinutes"] ?? "60");
        _refreshTokenExpiryDays = int.Parse(jwtSection["RefreshTokenExpiryDays"] ?? "7");
    }

    public (string AccessToken, string RefreshToken, DateTime ExpiresAt, DateTime RefreshTokenExpiresAt)
        GenerateTokens(User user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("FullName", user.FullName)
        };

        // Thêm các role của user vào claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        if (!string.IsNullOrEmpty(user.AvatarUrl))
            claims.Add(new Claim("AvatarUrl", user.AvatarUrl));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddMinutes(_accessTokenExpiryMinutes);

        var accessToken = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        var accessTokenString = new JwtSecurityTokenHandler().WriteToken(accessToken);

        // Refresh Token (random string an toàn)
        var refreshToken = GenerateRefreshToken();
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays);

        return (accessTokenString, refreshToken, expiresAt, refreshTokenExpiresAt);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
            ValidateLifetime = false // Quan trọng: cho phép token hết hạn
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out _);

        return principal;
    }

    public string GeneratePasswordResetToken(User user)
    {
        // Token reset mật khẩu ngắn hạn (30 phút), chứa UserId + random string
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        var token = Convert.ToBase64String(randomBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

        return token;
    }

    public string GenerateEmailConfirmationToken(User user)
    {
        // Có thể dùng cùng logic với password reset hoặc JWT ngắn hạn
        return GeneratePasswordResetToken(user);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}