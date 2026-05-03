using SocialGraphPlatform.Application.DTOs.Post;

namespace SocialGraphPlatform.Application.DTOs.Hashtag;

public class HashtagWithPostsDto
{
    public string Name { get; set; } = string.Empty;
    public int UsageCount { get; set; }

    public List<PostSummaryDto> Posts { get; set; } = new();
}