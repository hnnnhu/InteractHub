namespace SocialGraphPlatform.Application.DTOs.User;

public record UserStatsDto
{
    public int PostCount { get; init; }
    public int FriendCount { get; init; }           // Chỉ Friend, không có Follower
    public int StoryCount { get; init; }
    public int SavedPostCount { get; init; }
}