// SocialGraphPlatform.Application/Interfaces/Repositories/IBlockRepository.cs
using System;
using System.Threading.Tasks;
using SocialGraphPlatform.Application.DTOs.Block;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IBlockRepository : IGenericRepository<Block>
{
    /// <summary>
    /// Lấy bản ghi Block giữa 2 user, bao gồm cả những bản ghi đã bị soft-delete (IsDeleted = true).
    /// Phục vụ cho việc kiểm tra và gọi BlockAgain() thay vì tạo mới.
    /// </summary>
    Task<Block?> GetBlockIncludingDeletedAsync(Guid blockerId, Guid blockedId);

    Task<bool> IsBlockedAsync(Guid blockerId, Guid blockedId);

    Task<bool> UnblockUserAsync(Guid blockerId, Guid blockedId);

    /// <summary>
    /// Lấy danh sách người bị chặn, có hỗ trợ tìm kiếm (theo tên/username) và sắp xếp động
    /// </summary>
    Task<PagedResult<BlockedUserDto>> GetBlockedUsersAsync(
        Guid blockerId,
        string? search = null,
        string? sortBy = null,
        string? sortDirection = null,
        int pageNumber = 1,
        int pageSize = 20);
}