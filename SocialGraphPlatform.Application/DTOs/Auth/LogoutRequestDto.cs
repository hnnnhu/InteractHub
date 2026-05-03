// SocialGraphPlatform.Application/DTOs/Auth/LogoutRequestDto.cs
using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Auth;

public class LogoutRequestDto
{
    [Required(ErrorMessage = "Refresh Token là bắt buộc")]
    public string RefreshToken { get; set; } = string.Empty;
}