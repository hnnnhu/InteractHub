namespace SocialGraphPlatform.Application.DTOs.Comment;

public class CommentResponseDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }

    // Thông tin tác giả
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    public string Content { get; set; } = string.Empty;

    // Cấu trúc cây
    public Guid? ParentCommentId { get; set; }
    public string? ParentUserName { get; set; }

    // Thống kê
    public int ReplyCount { get; set; }

    // Thời gian
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    // Thuộc tính tính toán
    public bool IsEdited => UpdatedAt.HasValue && UpdatedAt.Value > CreatedAt;

    // Danh sách reply (hỗ trợ đệ quy)
    public List<CommentResponseDto> Replies { get; set; } = new();
}