// SocialGraphPlatform.Infrastructure/Repositories/ReactionRepository.cs

using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Reaction;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class ReactionRepository : GenericRepository<Reaction>, IReactionRepository
{
    public ReactionRepository(AppDbContext context) : base(context) { }

    // ====================== ADD / UPDATE REACTION ======================
    public async Task<ReactionCountDto> AddOrUpdateReactionAsync(Guid userId, Guid postId, ReactionType type)
    {
        // Tìm reaction hiện có, bỏ qua soft‑delete filter để tránh duplicate key
        var existing = await _context.Reactions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.PostId == postId && r.UserId == userId);

        if (existing != null)
        {
            if (existing.IsDeleted)
            {
                // Khôi phục reaction đã xoá mềm và đặt loại mới
                _context.Entry(existing).Property(e => e.IsDeleted).CurrentValue = false;
                _context.Entry(existing).Property(e => e.Type).CurrentValue = type;
                existing.SetUpdated(userId);
            }
            else
            {
                if (existing.Type == type)
                {
                    // Cùng loại → toggle (xoá mềm)
                    _context.Entry(existing).Property(e => e.IsDeleted).CurrentValue = true;
                    existing.SetUpdated(userId);
                }
                else
                {
                    // Khác loại → đổi loại
                    _context.Entry(existing).Property(e => e.Type).CurrentValue = type;
                    existing.SetUpdated(userId);
                }
            }
        }
        else
        {
            // Chưa có reaction nào → thêm mới
            var newReaction = new Reaction(postId, userId, type);
            await _context.Reactions.AddAsync(newReaction);
        }

        await _context.SaveChangesAsync();

        // Trả về summary mới nhất (đã lọc soft‑delete tự động)
        return await GetReactionSummaryAsync(postId, userId);
    }

    // ====================== REMOVE REACTION ======================
    public async Task RemoveReactionAsync(Guid userId, Guid postId)
    {
        var reaction = await _context.Reactions
            .FirstOrDefaultAsync(r => r.PostId == postId && r.UserId == userId);

        if (reaction != null)
        {
            // Soft delete được xử lý trong SaveChangesAsync của AppDbContext
            _context.Reactions.Remove(reaction);
            await _context.SaveChangesAsync();
        }
    }

    // ====================== GET REACTION SUMMARY ======================
    public async Task<ReactionCountDto> GetReactionSummaryAsync(Guid postId, Guid currentUserId)
    {
        // Lấy danh sách reaction (chỉ những record chưa bị soft‑delete)
        var reactions = await _context.Reactions
            .AsNoTracking()
            .Where(r => r.PostId == postId)
            .GroupBy(r => r.Type)
            .Select(g => new
            {
                Type = g.Key,
                Count = g.Count(),
                RecentUsers = g.OrderByDescending(r => r.CreatedAt)
                               .Take(5)
                               .Select(r => new UserSummaryDto
                               {
                                   Id = r.UserId,
                                   UserName = r.User.UserName,
                                   FullName = r.User.FullName,
                                   AvatarUrl = r.User.AvatarUrl
                               })
                               .ToList()
            })
            .ToListAsync();

        // Reaction hiện tại của user (nếu có)
        var currentUserReaction = await _context.Reactions
            .AsNoTracking()
            .Where(r => r.PostId == postId && r.UserId == currentUserId)
            .Select(r => r.Type)
            .FirstOrDefaultAsync();

        return new ReactionCountDto
        {
            TotalReactions = reactions.Sum(r => r.Count),
            Reactions = reactions.Select(r => new ReactionSummaryDto
            {
                Type = r.Type,
                Count = r.Count,
                RecentUsers = r.RecentUsers
            }).ToList(),
            CurrentUserReaction = currentUserReaction
        };
    }

    // ====================== GET USERS REACTED ======================
    public async Task<PagedResult<UserReactionDto>> GetUsersReactedAsync(
        Guid postId, int pageNumber = 1, int pageSize = 20)
    {
        var query = _context.Reactions
            .AsNoTracking()
            .Where(r => r.PostId == postId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new UserReactionDto
            {
                UserId = r.UserId,
                UserName = r.User.UserName,
                FullName = r.User.FullName,
                AvatarUrl = r.User.AvatarUrl,
                Type = r.Type,
                ReactedAt = r.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<UserReactionDto>(items, pageNumber, pageSize, totalCount);
    }
}