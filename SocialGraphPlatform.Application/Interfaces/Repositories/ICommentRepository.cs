// SocialGraphPlatform.Application/Interfaces/Repositories/ICommentRepository.cs
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface ICommentRepository : IGenericRepository<Comment>
{
    Task<PagedResult<Comment>> GetCommentsByPostIdAsync(Guid postId, int pageNumber, int pageSize);
    Task<PagedResult<Comment>> GetRepliesAsync(Guid parentCommentId, int pageNumber, int pageSize);

    // THÊM: Lấy map số lượng reply cho danh sách ID để tối ưu 1 query
    Task<Dictionary<Guid, int>> GetReplyCountsAsync(List<Guid> commentIds);

    Task<int> GetReplyCountAsync(Guid parentCommentId);
    Task<bool> ExistsActiveAsync(Guid commentId);
    Task<bool> IsOwnerAsync(Guid commentId, Guid userId);
}