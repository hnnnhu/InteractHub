// SocialGraphPlatform.Application/Interfaces/Repositories/IUserRepository.cs
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetUserWithDetailsAsync(Guid userId);

    Task<User?> GetUserByUsernameAsync(string username);

    Task<PagedResult<User>> SearchUsersAsync(string keyword, int pageNumber, int pageSize);

    Task<UserStatsDto> GetUserStatsAsync(Guid userId);

    Task<bool> IsFriendAsync(Guid userId1, Guid userId2);

    Task<bool> IsBlockedAsync(Guid userId, Guid blockedUserId);
}