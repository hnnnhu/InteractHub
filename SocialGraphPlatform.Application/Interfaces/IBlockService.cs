// SocialGraphPlatform.Application/Interfaces/IBlockService.cs
using System;
using System.Threading.Tasks;
using SocialGraphPlatform.Application.DTOs.Block;
using SocialGraphPlatform.Application.DTOs.Common;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IBlockService
{
    /// <summary>
    /// Chặn một người dùng khác
    /// </summary>
    Task<ApiResponse> BlockUserAsync(Guid currentUserId, BlockUserDto request);

    /// <summary>
    /// Gỡ chặn một người dùng
    /// </summary>
    Task<ApiResponse> UnblockUserAsync(Guid currentUserId, Guid blockedId);

    /// <summary>
    /// Lấy danh sách những người đang bị chặn (có tìm kiếm, sắp xếp, phân trang)
    /// </summary>
    Task<ApiResponse<PagedResult<BlockedUserDto>>> GetBlockedUsersAsync(
        Guid currentUserId,
        string? search = null,
        string? sortBy = null,
        string? sortDirection = null,
        int pageNumber = 1,
        int pageSize = 20);

    /// <summary>
    /// Kiểm tra trạng thái chặn toàn diện giữa 2 người dùng (cả 2 chiều)
    /// </summary>
    Task<ApiResponse<BlockStatusDto>> GetBlockStatusAsync(Guid currentUserId, Guid targetUserId);
}