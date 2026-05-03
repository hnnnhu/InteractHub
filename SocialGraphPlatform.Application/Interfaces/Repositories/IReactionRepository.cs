// SocialGraphPlatform.Application/Interfaces/Repositories/IReactionRepository.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Reaction;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IReactionRepository : IGenericRepository<Reaction>
{
    /// <summary>
    /// Thêm hoặc cập nhật cảm xúc (Like, Love, Haha...) cho bài viết
    /// Nếu đã có cảm xúc cùng loại → gỡ (toggle)
    /// Nếu khác loại → thay đổi cảm xúc
    /// </summary>
    Task<ReactionCountDto> AddOrUpdateReactionAsync(Guid userId, Guid postId, ReactionType type);

    /// <summary>
    /// Gỡ cảm xúc của người dùng khỏi bài viết
    /// </summary>
    Task RemoveReactionAsync(Guid userId, Guid postId);

    /// <summary>
    /// Lấy tóm tắt số lượng cảm xúc của bài viết + cảm xúc hiện tại của user
    /// </summary>
    Task<ReactionCountDto> GetReactionSummaryAsync(Guid postId, Guid currentUserId);

    /// <summary>
    /// Lấy danh sách người dùng đã thả cảm xúc cho bài viết (phân trang)
    /// </summary>
    Task<PagedResult<UserReactionDto>> GetUsersReactedAsync(
        Guid postId,
        int pageNumber = 1,
        int pageSize = 20);
}