using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Auth;

public record ResetPasswordRequestDto
{
    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Token là bắt buộc")]
    public string Token { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
    [MaxLength(100)]
    public string NewPassword { get; init; } = string.Empty;

    [Compare(nameof(NewPassword), ErrorMessage = "Xác nhận mật khẩu không khớp")]
    public string ConfirmNewPassword { get; init; } = string.Empty;
}