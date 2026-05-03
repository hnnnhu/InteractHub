using SocialGraphPlatform.Domain.Entities;
using System.Security.Claims;

namespace SocialGraphPlatform.Application.Interfaces;

public interface ITokenService
{
    /// <summary>
    /// Tạo cặp Access Token + Refresh Token cho user, kèm theo danh sách role của user.
    /// </summary>
    (string AccessToken, string RefreshToken, DateTime ExpiresAt, DateTime RefreshTokenExpiresAt)
        GenerateTokens(User user, IList<string> roles);

    /// <summary>
    /// Lấy ClaimsPrincipal từ Access Token đã hết hạn (dùng cho Refresh Token)
    /// </summary>
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);

    /// <summary>
    /// Tạo token reset mật khẩu (ngắn hạn, thường lưu vào DB)
    /// </summary>
    string GeneratePasswordResetToken(User user);

    /// <summary>
    /// (Tùy chọn) Tạo token xác thực email
    /// </summary>
    string GenerateEmailConfirmationToken(User user);
}