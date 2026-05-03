using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Comment;

public class CreateCommentDto
{
    [Required(ErrorMessage = "Bài viết không tồn tại")]
    public Guid PostId { get; set; }

    [Required(ErrorMessage = "Nội dung bình luận không được để trống")]
    [StringLength(2000, MinimumLength = 1, ErrorMessage = "Nội dung phải từ 1 đến 2000 ký tự")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// ID của bình luận cha. 
    /// Để null nếu là bình luận cấp 1 (gốc).
    /// </summary>
    public Guid? ParentCommentId { get; set; }
}