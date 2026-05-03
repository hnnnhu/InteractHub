// SocialGraphPlatform.Application/DTOs/Comment/CommentReplyDto.cs

namespace SocialGraphPlatform.Application.DTOs.Comment;

public class CommentReplyDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid ParentCommentId { get; set; }
    public Guid UserId { get; set; }

    // Thông tin tác giả
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    public bool IsEdited => UpdatedAt.HasValue && UpdatedAt.Value > CreatedAt;

    // ========================================================
    // ĐÃ BỔ SUNG: Khai báo 2 thuộc tính để hỗ trợ đệ quy
    // ========================================================

    // Thống kê số lượng câu trả lời con của Reply này
    public int ReplyCount { get; set; }

    // Danh sách các Reply lồng nhau (Cấp 3, Cấp 4...)
    public List<CommentReplyDto> Replies { get; set; } = new();
}