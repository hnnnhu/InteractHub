using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Auth;

public record ForgotPasswordRequestDto
{
    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    public string Email { get; init; } = string.Empty;
}