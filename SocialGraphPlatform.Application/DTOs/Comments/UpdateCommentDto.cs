using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Comments
{
    /// <summary>
    /// DTO dùng để cập nhật nội dung bình luận.
    /// Chỉ tác giả mới được phép chỉnh sửa.
    /// </summary>
    public class UpdateCommentDto
    {
        /// <summary>Nội dung mới của bình luận</summary>
        [Required(ErrorMessage = "Nội dung bình luận không được để trống")]
        [StringLength(2000, MinimumLength = 1, ErrorMessage = "Nội dung phải từ 1 đến 2000 ký tự")]
        public string Content { get; set; } = string.Empty;
    }
}