// SocialGraphPlatform.Infrastructure/Repositories/UserRepository.cs
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Providers; // THÊM: Provider xử lý Block
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class UserRepository : GenericRepository<User>, IUserRepository
{
    private readonly IBlockedUserProvider _blockedUserProvider;

    public UserRepository(AppDbContext context, IBlockedUserProvider blockedUserProvider)
        : base(context)
    {
        _blockedUserProvider = blockedUserProvider;
    }

    public async Task<User?> GetUserWithDetailsAsync(Guid userId)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        // CHẶN NHANH: Trả về null nếu user này nằm trong Blacklist
        // Ngăn chặn việc tải toàn bộ Post, Story nếu không có quyền truy cập
        if (excludedUserIds.Contains(userId))
            return null;

        return await _context.Users
            .AsNoTracking()
            .Include(u => u.Posts)
            .Include(u => u.Stories)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        return await _context.Users
            .AsNoTracking()
            // LỌC: Ẩn user nếu nằm trong danh sách chặn
            .Where(u => !excludedUserIds.Contains(u.Id))
            .FirstOrDefaultAsync(u => u.UserName == username && !u.IsDeleted);
    }

    public async Task<PagedResult<User>> SearchUsersAsync(string keyword, int pageNumber, int pageSize)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();
        var lowerKeyword = keyword?.ToLower() ?? string.Empty;

        var query = _context.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted)
            // LỌC: Ẩn hoàn toàn người bị chặn khỏi kết quả tìm kiếm
            .Where(u => !excludedUserIds.Contains(u.Id))
            .Where(u => string.IsNullOrEmpty(lowerKeyword) ||
                        u.FullName.ToLower().Contains(lowerKeyword) ||
                        u.UserName.ToLower().Contains(lowerKeyword));

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<User>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<UserStatsDto> GetUserStatsAsync(Guid userId)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        // CHẶN NHANH: Nếu đang xem stats của người mình chặn (hoặc bị chặn) -> Trả về 0 hết để bảo vệ quyền riêng tư
        if (excludedUserIds.Contains(userId))
        {
            return new UserStatsDto { PostCount = 0, FriendCount = 0, StoryCount = 0, SavedPostCount = 0 };
        }

        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && !u.IsDeleted)
            .Select(u => new
            {
                PostCount = u.Posts.Count(p => !p.IsDeleted),
                StoryCount = u.Stories.Count(s => !s.IsDeleted),
                SavedPostCount = u.SavedPosts.Count
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return new UserStatsDto { PostCount = 0, FriendCount = 0, StoryCount = 0, SavedPostCount = 0 };

        // Đếm bạn bè (FriendshipStatus = Accepted)
        var friendCount = await _context.Friendships
            .CountAsync(f => (f.RequesterId == userId || f.AddresseeId == userId)
                          && f.Status == FriendshipStatus.Accepted);

        return new UserStatsDto
        {
            PostCount = user.PostCount,
            FriendCount = friendCount,
            StoryCount = user.StoryCount,
            SavedPostCount = user.SavedPostCount
        };
    }

    public async Task<bool> IsFriendAsync(Guid userId1, Guid userId2)
    {
        return await _context.Friendships
            .AnyAsync(f => ((f.RequesterId == userId1 && f.AddresseeId == userId2) ||
                            (f.AddresseeId == userId1 && f.RequesterId == userId2)) &&
                           f.Status == FriendshipStatus.Accepted);
    }

    public async Task<bool> IsBlockedAsync(Guid userId, Guid blockedUserId)
    {
        return await _context.Blocks
            // ĐÃ SỬA LỖI: Cần thêm kiểm tra !b.IsDeleted để tránh tính nhầm những block đã được Gỡ (Restore)
            .AnyAsync(b => !b.IsDeleted &&
                          ((b.BlockerId == userId && b.BlockedId == blockedUserId) ||
                           (b.BlockedId == userId && b.BlockerId == blockedUserId)));
    }
}