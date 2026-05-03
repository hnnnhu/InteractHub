using System.ComponentModel.DataAnnotations;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Post;

public record CreatePostDto
{
    [MaxLength(10000, ErrorMessage = "Nội dung bài viết không được vượt quá 10.000 ký tự")]
    public string? Content { get; init; }

    [Required(ErrorMessage = "Quyền riêng tư là bắt buộc")]
    public PrivacyLevel Privacy { get; init; } = PrivacyLevel.Public;

    // Danh sách URL media (ảnh/video) người dùng upload
    public List<string> MediaUrls { get; init; } = new List<string>();

    // Danh sách hashtag người dùng nhập (ví dụ: ["dotnet", "csharp"])
    public List<string> Hashtags { get; init; } = new List<string>();
}