using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Auth;

public record RegisterRequestDto
{
    [Required(ErrorMessage = "Họ tên là bắt buộc")]
    [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
    public string FullName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Tên đăng nhập là bắt buộc")]
    [MinLength(3, ErrorMessage = "Tên đăng nhập phải có ít nhất 3 ký tự")]
    [MaxLength(50, ErrorMessage = "Tên đăng nhập không được vượt quá 50 ký tự")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới")]
    public string UserName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    [MaxLength(255)]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;

    [Compare(nameof(Password), ErrorMessage = "Xác nhận mật khẩu không khớp")]
    public string ConfirmPassword { get; init; } = string.Empty;
}