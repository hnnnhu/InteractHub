using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Auth;

public record LoginRequestDto
{
    [Required(ErrorMessage = "Email hoặc tên đăng nhập là bắt buộc")]
    public string EmailOrUserName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
    public string Password { get; init; } = string.Empty;
}