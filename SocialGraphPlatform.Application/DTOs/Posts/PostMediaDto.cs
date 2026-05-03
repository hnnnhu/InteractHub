using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Post;

public record PostMediaDto
{
    public Guid Id { get; init; }
    public string MediaUrl { get; init; } = string.Empty;
    public MediaType Type { get; init; }
    public int SortOrder { get; init; }
}