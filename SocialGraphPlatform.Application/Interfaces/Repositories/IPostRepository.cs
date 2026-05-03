// SocialGraphPlatform.Application/Interfaces/Repositories/IPostRepository.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IPostRepository : IGenericRepository<Post>
{
    Task<Post?> GetPostWithDetailsAsync(Guid postId);
    Task<PagedResult<Post>> GetNewsFeedAsync(Guid currentUserId, int pageNumber, int pageSize);
    Task<PagedResult<Post>> GetUserPostsAsync(Guid userId, int pageNumber, int pageSize);
    Task<bool> CanUserViewPostAsync(Guid postId, Guid currentUserId);
    Task<bool> ExistsActiveAsync(Guid postId);
    Task SaveChangesAsync();

    // THÊM DÒNG NÀY:
    Task<PagedResult<Post>> SearchPostsByKeywordAsync(Guid currentUserId, string keyword, int pageNumber, int pageSize);
}