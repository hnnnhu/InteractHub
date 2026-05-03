// SocialGraphPlatform.Infrastructure/Repositories/FriendshipRepository.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Friendship;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Providers;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories
{
    public class FriendshipRepository : GenericRepository<Friendship>, IFriendshipRepository
    {
        private readonly IBlockedUserProvider _blockedUserProvider;

        public FriendshipRepository(AppDbContext context, IBlockedUserProvider blockedUserProvider) : base(context)
        {
            _blockedUserProvider = blockedUserProvider;
        }

        public async Task<Friendship?> GetFriendshipAsync(Guid userId1, Guid userId2)
        {
            return await _context.Friendships
                .FirstOrDefaultAsync(f => !f.IsDeleted &&
                    ((f.RequesterId == userId1 && f.AddresseeId == userId2) ||
                     (f.RequesterId == userId2 && f.AddresseeId == userId1)));
        }

        public async Task<Friendship?> GetFriendshipAnyStateAsync(Guid userId1, Guid userId2)
        {
            return await _context.Friendships
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(f =>
                    ((f.RequesterId == userId1 && f.AddresseeId == userId2) ||
                     (f.RequesterId == userId2 && f.AddresseeId == userId1)));
        }

        public async Task<PagedResult<FriendRequestResponseDto>> GetPendingRequestsAsync(Guid userId, int pageNumber, int pageSize)
        {
            var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

            var query = _context.Friendships
                .AsNoTracking()
                .Where(f => !f.IsDeleted && f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
                .Where(f => !excludedUserIds.Contains(f.RequesterId))
                .Include(f => f.Requester);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(f => f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new FriendRequestResponseDto
                {
                    FriendshipId = f.Id,
                    RequesterId = f.RequesterId,
                    RequesterUserName = f.Requester.UserName,
                    RequesterFullName = f.Requester.FullName,
                    RequesterAvatarUrl = f.Requester.AvatarUrl,
                    RequesterBio = f.Requester.Bio,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<FriendRequestResponseDto>(items, pageNumber, pageSize, totalCount);
        }

        public async Task<PagedResult<SentFriendRequestResponseDto>> GetSentRequestsAsync(Guid userId, int pageNumber, int pageSize)
        {
            var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

            var query = _context.Friendships
                .AsNoTracking()
                .Where(f => !f.IsDeleted && f.RequesterId == userId && f.Status == FriendshipStatus.Pending)
                .Where(f => !excludedUserIds.Contains(f.AddresseeId))
                .Include(f => f.Addressee);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(f => f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new SentFriendRequestResponseDto
                {
                    FriendshipId = f.Id,
                    AddresseeId = f.AddresseeId,
                    AddresseeUserName = f.Addressee.UserName,
                    AddresseeFullName = f.Addressee.FullName,
                    AddresseeAvatarUrl = f.Addressee.AvatarUrl,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<SentFriendRequestResponseDto>(items, pageNumber, pageSize, totalCount);
        }

        public async Task<PagedResult<FriendshipResponseDto>> GetFriendsAsync(Guid userId, int pageNumber, int pageSize)
        {
            var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

            var query = _context.Friendships
                .AsNoTracking()
                .Where(f => !f.IsDeleted &&
                            (f.RequesterId == userId || f.AddresseeId == userId) &&
                            f.Status == FriendshipStatus.Accepted)
                .Where(f => !excludedUserIds.Contains(f.RequesterId == userId ? f.AddresseeId : f.RequesterId))
                .Include(f => f.Requester)
                .Include(f => f.Addressee);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(f => f.UpdatedAt ?? f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new FriendshipResponseDto
                {
                    Id = f.Id,
                    RequesterId = f.RequesterId,
                    RequesterUserName = f.Requester.UserName,
                    RequesterFullName = f.Requester.FullName,
                    RequesterAvatarUrl = f.Requester.AvatarUrl,
                    AddresseeId = f.AddresseeId,
                    AddresseeUserName = f.Addressee.UserName,
                    AddresseeFullName = f.Addressee.FullName,
                    AddresseeAvatarUrl = f.Addressee.AvatarUrl,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt,
                    IsCloseFriend = f.IsCloseFriend  // quan trọng: ánh xạ cờ bạn thân
                })
                .ToListAsync();

            return new PagedResult<FriendshipResponseDto>(items, pageNumber, pageSize, totalCount);
        }

        public async Task<List<FriendSuggestionDto>> GetFriendSuggestionsAsync(Guid userId, int count = 10)
        {
            var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

            // 1. Danh sách ID bạn bè hiện tại
            var myFriendIds = _context.Friendships
                .Where(f => !f.IsDeleted && f.Status == FriendshipStatus.Accepted &&
                            (f.RequesterId == userId || f.AddresseeId == userId))
                .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId);

            // 2. Truy vấn gợi ý
            var suggestionsQuery = _context.Users
                .AsNoTracking()
                .Where(u => u.Id != userId && !u.IsDeleted)
                .Where(u => !excludedUserIds.Contains(u.Id))
                .Where(u => !_context.Friendships.Any(f => !f.IsDeleted &&
                    ((f.RequesterId == userId && f.AddresseeId == u.Id) ||
                     (f.AddresseeId == userId && f.RequesterId == u.Id))))
                .Select(u => new
                {
                    User = u,
                    MutualCount = _context.Friendships.Count(f =>
                        !f.IsDeleted && f.Status == FriendshipStatus.Accepted &&
                        (f.RequesterId == u.Id || f.AddresseeId == u.Id) &&
                        myFriendIds.Contains(f.RequesterId == u.Id ? f.AddresseeId : f.RequesterId))
                });

            var items = await suggestionsQuery
                .OrderByDescending(x => x.MutualCount)
                .Take(count)
                .ToListAsync();

            return items.Select(x => new FriendSuggestionDto
            {
                UserId = x.User.Id,
                UserName = x.User.UserName,
                FullName = x.User.FullName,
                AvatarUrl = x.User.AvatarUrl,
                Bio = x.User.Bio,
                MutualFriendsCount = x.MutualCount,
                SuggestionReason = x.MutualCount > 0 ? $"Có {x.MutualCount} bạn chung" : "Gợi ý kết bạn"
            }).ToList();
        }

        // === FIXED: Sửa lỗi logic so sánh sai (trước đây: f.RequesterId == userId2 && f.RequesterId == userId1) ===
        public async Task<bool> IsFriendAsync(Guid userId1, Guid userId2)
        {
            return await _context.Friendships
                .AnyAsync(f => !f.IsDeleted &&
                               ((f.RequesterId == userId1 && f.AddresseeId == userId2) ||
                                (f.RequesterId == userId2 && f.AddresseeId == userId1)) &&
                               f.Status == FriendshipStatus.Accepted);
        }

        public async Task<int> GetFriendCountAsync(Guid userId)
        {
            var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

            return await _context.Friendships
                .CountAsync(f => !f.IsDeleted &&
                                 (f.RequesterId == userId || f.AddresseeId == userId) &&
                                 f.Status == FriendshipStatus.Accepted &&
                                 !excludedUserIds.Contains(f.RequesterId == userId ? f.AddresseeId : f.RequesterId));
        }

        // ==================== CLOSE FRIEND METHODS ====================

        public async Task<bool> IsCloseFriendAsync(Guid userId, Guid otherUserId)
        {
            return await _context.Friendships
                .AnyAsync(f => !f.IsDeleted &&
                               ((f.RequesterId == userId && f.AddresseeId == otherUserId) ||
                                (f.RequesterId == otherUserId && f.AddresseeId == userId)) &&
                               f.Status == FriendshipStatus.Accepted &&
                               f.IsCloseFriend);
        }

        public async Task<PagedResult<UserSummaryDto>> GetCloseFriendsAsync(Guid userId, int pageNumber, int pageSize)
        {
            var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

            var query = _context.Friendships
                .AsNoTracking()
                .Where(f => !f.IsDeleted &&
                            (f.RequesterId == userId || f.AddresseeId == userId) &&
                            f.Status == FriendshipStatus.Accepted &&
                            f.IsCloseFriend)
                .Where(f => !excludedUserIds.Contains(f.RequesterId == userId ? f.AddresseeId : f.RequesterId))
                .Include(f => f.Requester)
                .Include(f => f.Addressee);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(f => f.UpdatedAt ?? f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new UserSummaryDto
                {
                    Id = f.RequesterId == userId ? f.AddresseeId : f.RequesterId,
                    UserName = f.RequesterId == userId ? f.Addressee.UserName : f.Requester.UserName,
                    FullName = f.RequesterId == userId ? f.Addressee.FullName : f.Requester.FullName,
                    AvatarUrl = f.RequesterId == userId ? f.Addressee.AvatarUrl : f.Requester.AvatarUrl,
                    IsFriend = true,
                    FriendshipStatus = FriendshipStatus.Accepted,
                    IsCloseFriend = true       // tất cả đều là bạn thân
                })
                .ToListAsync();

            return new PagedResult<UserSummaryDto>(items, pageNumber, pageSize, totalCount);
        }
    }
}