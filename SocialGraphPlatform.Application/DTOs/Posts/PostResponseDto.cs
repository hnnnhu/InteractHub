using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Post;

public record PostResponseDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }

    public string? Content { get; init; }
    public PrivacyLevel Privacy { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }

    // Media
    public List<PostMediaDto> MediaItems { get; init; } = new();

    // Thống kê
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }
    public int ShareCount { get; init; }        // Nếu sau này thêm share

    // Trạng thái với người xem hiện tại
    public bool IsLikedByCurrentUser { get; init; }
    public bool IsSavedByCurrentUser { get; init; }

    // Hashtags
    public List<string> Hashtags { get; init; } = new();
}