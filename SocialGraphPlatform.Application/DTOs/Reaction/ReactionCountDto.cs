using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Reaction;

public class ReactionCountDto
{
    public int TotalReactions { get; set; }

    // Danh sách các loại cảm xúc và số lượng
    public List<ReactionSummaryDto> Reactions { get; set; } = new();

    // Cảm xúc của người dùng hiện tại (nếu có)
    public ReactionType? CurrentUserReaction { get; set; }

    public bool IsLikedByCurrentUser => CurrentUserReaction.HasValue;
}