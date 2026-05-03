using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.User;

public record UpdateProfileDto
{
    [Required(ErrorMessage = "Họ tên là bắt buộc")]
    [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
    public string FullName { get; init; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Tiểu sử không được vượt quá 500 ký tự")]
    public string? Bio { get; init; }

    [MaxLength(500)]
    public string? AvatarUrl { get; init; }

    [MaxLength(500)]
    public string? CoverPhotoUrl { get; init; }

    public DateTime? DateOfBirth { get; init; }
}