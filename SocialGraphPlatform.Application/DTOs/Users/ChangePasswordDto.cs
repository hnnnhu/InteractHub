using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.User;

public record ChangePasswordDto
{
    [Required(ErrorMessage = "Mật khẩu hiện tại là bắt buộc")]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
    [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự")]
    [MaxLength(100)]
    public string NewPassword { get; init; } = string.Empty;

    [Compare(nameof(NewPassword), ErrorMessage = "Xác nhận mật khẩu không khớp")]
    public string ConfirmNewPassword { get; init; } = string.Empty;
}