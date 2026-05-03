using System;

namespace SocialGraphPlatform.Application.DTOs.SavedPost;

public class SavedPostSummaryDto
{
    public Guid PostId { get; set; }
    public string? MediaUrl { get; set; } // Ảnh đại diện/thumbnail của bài viết
    public DateTimeOffset SavedAt { get; set; }
}