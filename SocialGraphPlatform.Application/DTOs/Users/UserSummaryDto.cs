namespace SocialGraphPlatform.Application.DTOs.User;

public record UserSummaryDto
{
    public Guid Id { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }

    // Trạng thái quan hệ với người xem hiện tại
    public bool IsFriend { get; init; }
    public SocialGraphPlatform.Domain.Enums.FriendshipStatus? FriendshipStatus { get; init; }

    /// <summary>
    /// Cho biết người này có phải là bạn thân của người xem hay không.
    /// Chỉ có ý nghĩa khi IsFriend == true.
    /// </summary>
    public bool IsCloseFriend { get; init; }
}