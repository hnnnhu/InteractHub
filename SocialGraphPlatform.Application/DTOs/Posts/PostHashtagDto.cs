namespace SocialGraphPlatform.Application.DTOs.Post;

public record PostHashtagDto
{
    public Guid HashtagId { get; init; }
    public string Name { get; init; } = string.Empty;
}