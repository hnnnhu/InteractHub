namespace SocialGraphPlatform.Application.DTOs.Comment;

public class CommentTreeDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    public bool IsEdited => UpdatedAt.HasValue && UpdatedAt.Value > CreatedAt;

    public int ReplyCount { get; set; }

    // Danh sách các reply (cấp 2)
    public List<CommentTreeDto> Replies { get; set; } = new();
}