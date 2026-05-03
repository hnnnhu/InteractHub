using SocialGraphPlatform.Application.DTOs.Comment;
using SocialGraphPlatform.Application.DTOs.Comments;
using SocialGraphPlatform.Application.DTOs.Common;

namespace SocialGraphPlatform.Application.Interfaces;

public interface ICommentService
{
    /// <summary>
    /// Tạo bình luận mới (cấp 1 hoặc reply)
    /// </summary>
    Task<ApiResponse<IdDto>> CreateCommentAsync(Guid currentUserId, CreateCommentDto request);

    /// <summary>
    /// Cập nhật nội dung bình luận
    /// </summary>
    Task<ApiResponse> UpdateCommentAsync(Guid currentUserId, Guid commentId, UpdateCommentDto request);

    /// <summary>
    /// Xóa bình luận
    /// </summary>
    Task<ApiResponse> DeleteCommentAsync(Guid currentUserId, Guid commentId);

    /// <summary>
    /// Lấy danh sách bình luận cấp 1 của bài viết (phân trang)
    /// </summary>
    Task<ApiResponse<PagedResult<CommentResponseDto>>> GetCommentsByPostIdAsync(
        Guid currentUserId, Guid postId, int pageNumber, int pageSize);

    /// <summary>
    /// Lấy danh sách reply của một bình luận cha
    /// </summary>
    Task<ApiResponse<PagedResult<CommentReplyDto>>> GetRepliesAsync(
        Guid currentUserId, Guid parentCommentId, int pageNumber, int pageSize);
}