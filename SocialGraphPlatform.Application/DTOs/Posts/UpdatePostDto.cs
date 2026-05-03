using System.ComponentModel.DataAnnotations;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Post;

public record UpdatePostDto
{
    [Required(ErrorMessage = "Id bài viết là bắt buộc")]
    public Guid PostId { get; init; }

    [MaxLength(10000, ErrorMessage = "Nội dung bài viết không được vượt quá 10.000 ký tự")]
    public string? Content { get; init; }

    [Required(ErrorMessage = "Quyền riêng tư là bắt buộc")]
    public PrivacyLevel Privacy { get; init; }
}