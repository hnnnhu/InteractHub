// SocialGraphPlatform.Infrastructure/Repositories/BlockRepository.cs
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Block;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class BlockRepository : GenericRepository<Block>, IBlockRepository
{
    public BlockRepository(AppDbContext context) : base(context) { }

    /// <summary>
    /// Lấy bản ghi Block bao gồm cả những bản ghi đã bị soft-delete.
    /// Dùng cho nghiệp vụ BlockUser: kiểm tra xem đã từng block chưa để Restore lại.
    /// </summary>
    public async Task<Block?> GetBlockIncludingDeletedAsync(Guid blockerId, Guid blockedId)
    {
        return await _context.Blocks
            .IgnoreQueryFilters() // Quan trọng: Bỏ qua Global Query Filter để quét cả các dòng IsDeleted = true
            .FirstOrDefaultAsync(b => b.BlockerId == blockerId && b.BlockedId == blockedId);
    }

    public async Task<bool> IsBlockedAsync(Guid blockerId, Guid blockedId)
    {
        return await _context.Blocks
            .AnyAsync(b => b.BlockerId == blockerId &&
                          b.BlockedId == blockedId &&
                          !b.IsDeleted);
    }

    public async Task<bool> UnblockUserAsync(Guid blockerId, Guid blockedId)
    {
        var block = await _context.Blocks
            .FirstOrDefaultAsync(b => b.BlockerId == blockerId &&
                                     b.BlockedId == blockedId &&
                                     !b.IsDeleted);

        if (block == null)
            return false;

        block.Unblock(blockerId); // Entity method xử lý logic Unblock (chuyển IsDeleted = true)

        await _context.SaveChangesAsync(); // Hoặc chuyển lên UnitOfWork tùy theo architecture của bạn
        return true;
    }

    /// <summary>
    /// Lấy danh sách người bị chặn, có hỗ trợ tìm kiếm và sắp xếp động
    /// </summary>
    public async Task<PagedResult<BlockedUserDto>> GetBlockedUsersAsync(
        Guid blockerId,
        string? search = null,
        string? sortBy = null,
        string? sortDirection = null,
        int pageNumber = 1,
        int pageSize = 20)
    {
        var query = _context.Blocks
            .AsNoTracking()
            .Include(b => b.Blocked) // Join với bảng User để lấy thông tin người bị block
            .Where(b => b.BlockerId == blockerId && !b.IsDeleted);

        // 1. LỌC THEO TÊN HOẶC USERNAME (Search)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.ToLower();
            query = query.Where(b => b.Blocked.FullName.ToLower().Contains(searchTerm) ||
                                     b.Blocked.UserName.ToLower().Contains(searchTerm));
        }

        // 2. SẮP XẾP ĐỘNG (Sort)
        bool isAscending = sortDirection?.ToLower() == "asc";
        sortBy = sortBy?.ToLower() ?? "createdat"; // Mặc định sắp xếp theo ngày chặn (CreatedAt)

        query = sortBy switch
        {
            "name" => isAscending
                ? query.OrderBy(b => b.Blocked.FullName)
                : query.OrderByDescending(b => b.Blocked.FullName),
            "username" => isAscending
                ? query.OrderBy(b => b.Blocked.UserName)
                : query.OrderByDescending(b => b.Blocked.UserName),
            _ => isAscending
                ? query.OrderBy(b => b.CreatedAt)
                : query.OrderByDescending(b => b.CreatedAt) // Mặc định
        };

        // Đếm tổng số lượng bản ghi sau khi đã áp dụng bộ lọc (để phục vụ phân trang)
        var totalCount = await query.CountAsync();

        // 3. PHÂN TRANG VÀ MAP SANG DTO
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BlockedUserDto
            {
                BlockId = b.Id,
                BlockedId = b.BlockedId,
                UserName = b.Blocked.UserName,
                FullName = b.Blocked.FullName,
                AvatarUrl = b.Blocked.AvatarUrl,
                Bio = b.Blocked.Bio,
                BlockedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<BlockedUserDto>(items, pageNumber, pageSize, totalCount);
    }
}