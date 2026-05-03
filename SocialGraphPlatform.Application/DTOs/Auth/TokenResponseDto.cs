// SocialGraphPlatform.Application/DTOs/Auth/TokenResponseDto.cs

namespace SocialGraphPlatform.Application.DTOs.Auth;

public class TokenResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;

    // 🚀 BẮT BUỘC THÊM: Để AuthService.cs biên dịch được và Client nhận được SessionId mới
    public Guid SessionId { get; set; }

    public DateTime ExpiresAt { get; set; }
}