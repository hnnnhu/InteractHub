using System;

namespace SocialGraphPlatform.Application.DTOs.SavedPost;

public class SavedPostResponseDto
{
    // Thông tin định danh của thao tác lưu
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string CollectionName { get; set; } = "Mặc định";

    // Thông tin chi tiết của bài viết được lưu (phục vụ hiển thị Feed)
    public string PostContent { get; set; } = string.Empty;
    public string? PostMediaUrl { get; set; }
    public DateTimeOffset PostCreatedAt { get; set; }

    // Thông tin tác giả của bài viết đó
    public string PostAuthorUserName { get; set; } = string.Empty;
    public string PostAuthorFullName { get; set; } = string.Empty;
    public string? PostAuthorAvatarUrl { get; set; }

    // Thời gian thao tác
    public DateTimeOffset SavedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}