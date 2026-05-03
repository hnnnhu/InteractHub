using System.ComponentModel.DataAnnotations;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Story;

public class CreateStoryDto
{
    /// <summary>Nội dung văn bản (có thể để trống nếu chỉ đăng media)</summary>
    [MaxLength(500, ErrorMessage = "Nội dung Story không được vượt quá 500 ký tự")]
    public string? Content { get; set; }

    /// <summary>Đường dẫn media (ảnh hoặc video)</summary>
    [Required(ErrorMessage = "MediaUrl là bắt buộc khi tạo Story")]
    [MaxLength(500)]
    public string MediaUrl { get; set; } = string.Empty;

    /// <summary>Loại media</summary>
    [Required(ErrorMessage = "Loại media là bắt buộc")]
    public MediaType Type { get; set; } = MediaType.Image;

    /// <summary>Quyền riêng tư của Story</summary>
    public PrivacyLevel Privacy { get; set; } = PrivacyLevel.Public;

    /// <summary>Thời gian tồn tại (giờ). Mặc định là 24 giờ</summary>
    [Range(1, 168, ErrorMessage = "Thời gian tồn tại phải từ 1 đến 168 giờ")]
    public int DurationHours { get; set; } = 24;
}