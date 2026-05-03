// SocialGraphPlatform.Application/DTOs/User/UserProfileDto.cs

using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.User;

public record UserProfileDto
{
    public Guid Id { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? Bio { get; init; }
    public string? AvatarUrl { get; init; }
    public string? CoverPhotoUrl { get; init; }
    public DateTime? DateOfBirth { get; init; }

    // [ĐÃ FIX]: Đồng bộ với Entity User, dùng DateTime thay vì DateTimeOffset
    public DateTime CreatedAt { get; init; }

    // Thống kê
    public int PostCount { get; init; }
    public int FriendCount { get; init; }           // Số bạn bè (không có follower)
    public int StoryCount { get; init; }

    // Trạng thái quan hệ với người đang xem profile
    public bool IsFriend { get; init; }
    public bool IsBlocked { get; init; }
    public FriendshipStatus? FriendshipStatus { get; init; }

    public bool IsPrivateProfileView { get; init; }

    public PrivacyLevel ProfileVisibility { get; init; }
}