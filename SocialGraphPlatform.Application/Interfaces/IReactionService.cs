// SocialGraphPlatform.Application/Interfaces/IReactionService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Reaction;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IReactionService
{
    /// <summary>
    /// Thả hoặc thay đổi cảm xúc cho bài viết
    /// (Toggle: nếu cùng loại thì gỡ, khác loại thì thay đổi)
    /// </summary>
    Task<ApiResponse<ReactionCountDto>> AddOrUpdateReactionAsync(Guid currentUserId, AddReactionDto request);

    /// <summary>
    /// Gỡ cảm xúc của người dùng hiện tại khỏi bài viết
    /// </summary>
    Task<ApiResponse> RemoveReactionAsync(Guid currentUserId, Guid postId);

    /// <summary>
    /// Lấy tóm tắt số lượng cảm xúc của một bài viết
    /// </summary>
    Task<ApiResponse<ReactionCountDto>> GetReactionSummaryAsync(Guid currentUserId, Guid postId);

    /// <summary>
    /// Lấy danh sách người dùng đã thả cảm xúc cho bài viết (phân trang)
    /// </summary>
    Task<ApiResponse<PagedResult<UserReactionDto>>> GetUsersReactedAsync(
        Guid postId, int pageNumber = 1, int pageSize = 20);
}