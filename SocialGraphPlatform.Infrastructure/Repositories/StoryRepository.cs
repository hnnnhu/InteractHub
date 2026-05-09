// SocialGraphPlatform.Infrastructure/Repositories/StoryRepository.cs

using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class StoryRepository : GenericRepository<Story>, IStoryRepository
{
    private const int MaxFeedStories = 500;

    public StoryRepository(AppDbContext context) : base(context) { }

    /// <inheritdoc/>
    public async Task<Story?> GetStoryWithDetailsAsync(Guid storyId)
    {
        return await _context.Stories
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Views)
            .FirstOrDefaultAsync(s => s.Id == storyId && !s.IsDeleted);
    }

    /// <inheritdoc/>
    public async Task<List<Story>> GetActiveStoriesByUserAsync(Guid userId)
    {
        return await _context.Stories
            .AsNoTracking()
            .Where(s => s.UserId == userId && !s.IsDeleted && s.ExpiresAt > DateTime.UtcNow)
            .Include(s => s.User)
            .Include(s => s.Views)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<List<Story>> GetActiveStoriesFeedAsync(Guid currentUserId)
    {
        var friendIds = await _context.Friendships
            .Where(f => (f.RequesterId == currentUserId || f.AddresseeId == currentUserId)
                     && f.Status == FriendshipStatus.Accepted)
            .Select(f => f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId)
            .ToListAsync();

        friendIds.Add(currentUserId);

        var stories = await _context.Stories
            .AsNoTracking()
            .Where(s => friendIds.Contains(s.UserId) && !s.IsDeleted && s.ExpiresAt > DateTime.UtcNow)
            .Include(s => s.User)
            .Include(s => s.Views.Where(v => v.ViewerId == currentUserId))
            .OrderByDescending(s => s.CreatedAt)
            .Take(MaxFeedStories)
            .ToListAsync();

        return stories;
    }

    /// <inheritdoc/>
    public async Task<bool> IsStoryActiveAsync(Guid storyId)
    {
        return await _context.Stories
            .AnyAsync(s => s.Id == storyId && !s.IsDeleted && s.ExpiresAt > DateTime.UtcNow);
    }

    /// <inheritdoc/>
    public async Task<PagedResult<StoryView>> GetStoryViewsAsync(Guid storyId, int pageNumber, int pageSize)
    {
        var query = _context.StoryViews
            .AsNoTracking()
            .Where(v => v.StoryId == storyId)
            .Include(v => v.Viewer)
            .OrderByDescending(v => v.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<StoryView>(items, pageNumber, pageSize, totalCount);
    }

    /// <inheritdoc/>
    public async Task<Dictionary<Guid, int>> GetViewCountsAsync(IEnumerable<Guid> storyIds)
    {
        if (storyIds == null || !storyIds.Any())
            return new Dictionary<Guid, int>();

        return await _context.StoryViews
            .Where(v => storyIds.Contains(v.StoryId))
            .GroupBy(v => v.StoryId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);
    }
    public async Task<Story?> GetStoryForUpdateAsync(Guid storyId)
    {
        return await _context.Stories
            .Include(s => s.Views)
            .FirstOrDefaultAsync(s => s.Id == storyId && !s.IsDeleted);
    }
    public async Task AddStoryViewAsync(StoryView storyView)
    {
        // AddAsync sẽ chèn ép EF Core đánh dấu đây là 1 bản ghi mới cần INSERT
        await _context.StoryViews.AddAsync(storyView);
    }

}