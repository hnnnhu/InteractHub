using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Reaction;

public class ReactionSummaryDto
{
    public ReactionType Type { get; set; }
    public string TypeName => Type.ToString();
    public int Count { get; set; }

    // Danh sách một vài người đã thả cảm xúc này (tối đa 3-5 người)
    public List<UserSummaryDto> RecentUsers { get; set; } = new();
}