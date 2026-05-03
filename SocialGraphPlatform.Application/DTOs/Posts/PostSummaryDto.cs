// SocialGraphPlatform.Application/DTOs/Post/PostSummaryDto.cs

using System;
using System.Collections.Generic;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Post;

public record PostSummaryDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }

    public string? Content { get; init; }                    // Có thể cắt ngắn
    public PrivacyLevel Privacy { get; init; }
    public DateTimeOffset CreatedAt { get; init; }

    // Media đầu tiên (thường dùng để hiển thị thumbnail)
    public string? FirstMediaUrl { get; init; }
    public int MediaCount { get; init; }

    // Thống kê
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }

    // Trạng thái cá nhân hóa
    public bool IsLikedByCurrentUser { get; init; }
    public bool IsSavedByCurrentUser { get; init; }

    // BỔ SUNG: Danh sách các hashtag đính kèm trong bài viết
    public List<string> Hashtags { get; init; } = new List<string>();
}