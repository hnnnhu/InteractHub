using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Reaction;

public class UserReactionDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public ReactionType Type { get; set; }
    public DateTimeOffset ReactedAt { get; set; }
}