namespace SocialGraphPlatform.Application.DTOs.Post;

public record PostReactionSummaryDto
{
    public int TotalReactions { get; init; }
    public Dictionary<string, int> ReactionCounts { get; init; } = new(); // Ví dụ: {"Like": 15, "Heart": 8}
    public bool IsReactedByCurrentUser { get; init; }
    public string? CurrentUserReactionType { get; init; }
}