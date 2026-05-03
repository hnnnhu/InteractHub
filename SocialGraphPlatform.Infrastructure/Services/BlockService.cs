// SocialGraphPlatform.Infrastructure/Services/BlockService.cs
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Application.DTOs.Block;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Providers;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Services;

public class BlockService : IBlockService
{
    private readonly IBlockRepository _blockRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFriendshipRepository _friendshipRepository;
    private readonly IBlockedUserProvider _blockedUserProvider;
    private readonly ILogger<BlockService> _logger;

    public BlockService(
        IBlockRepository blockRepository,
        IUserRepository userRepository,
        IFriendshipRepository friendshipRepository,
        IBlockedUserProvider blockedUserProvider,
        ILogger<BlockService> logger)
    {
        _blockRepository = blockRepository;
        _userRepository = userRepository;
        _friendshipRepository = friendshipRepository;
        _blockedUserProvider = blockedUserProvider;
        _logger = logger;
    }

    public async Task<ApiResponse> BlockUserAsync(Guid currentUserId, BlockUserDto request)
    {
        _logger.LogInformation("Bắt đầu xử lý yêu cầu chặn. BlockerId: {BlockerId}, BlockedId: {BlockedId}", currentUserId, request.BlockedId);

        // 1. Kiểm tra không được tự chặn chính mình
        if (currentUserId == request.BlockedId)
        {
            _logger.LogWarning("Thất bại: User {UserId} cố gắng tự chặn chính mình.", currentUserId);
            return ApiResponse.Fail("Bạn không thể chặn chính mình.");
        }

        // 2. Kiểm tra người bị chặn có tồn tại trong hệ thống không
        var userExists = await _userRepository.ExistsAsync(u => u.Id == request.BlockedId);
        if (!userExists)
        {
            _logger.LogWarning("Thất bại: Người dùng bị chặn ({BlockedId}) không tồn tại trên hệ thống.", request.BlockedId);
            return ApiResponse.Fail("Người dùng bị chặn không tồn tại trên hệ thống.");
        }

        // 3. Xử lý Block Entity
        var existingBlock = await _blockRepository.GetBlockIncludingDeletedAsync(currentUserId, request.BlockedId);

        if (existingBlock != null)
        {
            if (!existingBlock.IsDeleted)
            {
                _logger.LogInformation("Thất bại: User {BlockerId} đã chặn {BlockedId} từ trước.", currentUserId, request.BlockedId);
                return ApiResponse.Fail("Bạn đã chặn người dùng này rồi.");
            }

            existingBlock.BlockAgain(currentUserId);
            _blockRepository.Update(existingBlock);
            _logger.LogInformation("Khôi phục bản ghi chặn cũ giữa {BlockerId} và {BlockedId}.", currentUserId, request.BlockedId);
        }
        else
        {
            var newBlock = new Block(currentUserId, request.BlockedId);
            await _blockRepository.AddAsync(newBlock);
            _logger.LogInformation("Tạo mới bản ghi chặn giữa {BlockerId} và {BlockedId}.", currentUserId, request.BlockedId);
        }

        // 4. XỬ LÝ SIDE-EFFECT: Hủy kết bạn (nếu có)
        var existingFriendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, request.BlockedId);
        if (existingFriendship != null)
        {
            _friendshipRepository.Remove(existingFriendship);
            _logger.LogInformation("Đã xử lý side-effect: Hủy quan hệ bạn bè/lời mời giữa {BlockerId} và {BlockedId}.", currentUserId, request.BlockedId);
        }

        // Lưu toàn bộ thay đổi (Block + Friendship) vào Database
        await _blockRepository.SaveChangesAsync();

        // 5. XÓA CACHE: Đảm bảo các truy vấn phía sau lấy được danh sách chặn mới nhất
        _blockedUserProvider.InvalidateCache();

        _logger.LogInformation("Hoàn tất: User {BlockerId} đã chặn {BlockedId} thành công.", currentUserId, request.BlockedId);
        return ApiResponse.Ok("Đã chặn người dùng thành công.");
    }

    public async Task<ApiResponse> UnblockUserAsync(Guid currentUserId, Guid blockedId)
    {
        _logger.LogInformation("Bắt đầu xử lý gỡ chặn. BlockerId: {BlockerId}, BlockedId: {BlockedId}", currentUserId, blockedId);

        var success = await _blockRepository.UnblockUserAsync(currentUserId, blockedId);

        if (!success)
        {
            _logger.LogWarning("Gỡ chặn thất bại: Không tìm thấy bản ghi chặn hoặc không có quyền gỡ. BlockerId: {BlockerId}, BlockedId: {BlockedId}", currentUserId, blockedId);
            return ApiResponse.Fail("Không tìm thấy lệnh chặn hoặc bạn không có quyền gỡ.");
        }

        // XÓA CACHE sau khi gỡ chặn thành công
        _blockedUserProvider.InvalidateCache();

        _logger.LogInformation("Hoàn tất: Đã gỡ chặn thành công. BlockerId: {BlockerId}, BlockedId: {BlockedId}", currentUserId, blockedId);
        return ApiResponse.Ok("Đã gỡ chặn thành công.");
    }

    public async Task<ApiResponse<PagedResult<BlockedUserDto>>> GetBlockedUsersAsync(
        Guid currentUserId,
        string? search = null,
        string? sortBy = null,
        string? sortDirection = null,
        int pageNumber = 1,
        int pageSize = 20)
    {
        var pagedResult = await _blockRepository.GetBlockedUsersAsync(currentUserId, search, sortBy, sortDirection, pageNumber, pageSize);
        return ApiResponse<PagedResult<BlockedUserDto>>.Ok(pagedResult);
    }

    public async Task<ApiResponse<BlockStatusDto>> GetBlockStatusAsync(Guid currentUserId, Guid targetUserId)
    {
        var isBlockedByMe = await _blockRepository.IsBlockedAsync(currentUserId, targetUserId);
        var hasBlockedMe = await _blockRepository.IsBlockedAsync(targetUserId, currentUserId);

        var status = new BlockStatusDto
        {
            IsBlockedByMe = isBlockedByMe,
            HasBlockedMe = hasBlockedMe
        };

        return ApiResponse<BlockStatusDto>.Ok(status);
    }
}