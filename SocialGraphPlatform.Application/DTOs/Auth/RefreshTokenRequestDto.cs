using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Auth;

public record RefreshTokenRequestDto
{
    [Required(ErrorMessage = "Access Token là bắt buộc")]
    public string Token { get; init; } = string.Empty;

    [Required(ErrorMessage = "Refresh Token là bắt buộc")]
    public string RefreshToken { get; init; } = string.Empty;
}