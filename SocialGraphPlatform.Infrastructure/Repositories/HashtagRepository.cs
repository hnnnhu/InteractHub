// SocialGraphPlatform.Infrastructure/Repositories/HashtagRepository.cs

using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Hashtag;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class HashtagRepository : GenericRepository<Hashtag>, IHashtagRepository
{
    public HashtagRepository(AppDbContext context) : base(context) { }

    public async Task<PagedResult<Hashtag>> SearchHashtagsAsync(HashtagSearchDto request)
    {
        var query = _context.Hashtags
            .AsNoTracking()
            .Where(h => string.IsNullOrEmpty(request.Keyword) ||
                       h.Name.Contains(request.Keyword));

        // Sắp xếp
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending
                ? query.OrderByDescending(h => h.Name)
                : query.OrderBy(h => h.Name),
            _ => request.SortDescending
                ? query.OrderByDescending(h => h.UsageCount)
                : query.OrderBy(h => h.UsageCount)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResult<Hashtag>(items, request.PageNumber, request.PageSize, totalCount);
    }

    public async Task<List<Hashtag>> GetTrendingHashtagsAsync(int count = 10)
    {
        return await _context.Hashtags
            .AsNoTracking()
            .OrderByDescending(h => h.UsageCount)
            .Take(count)
            .ToListAsync();
    }

    // ========================================================
    // Hàm lấy Hashtag cơ bản dùng để kiểm tra tồn tại
    // ========================================================
    public async Task<Hashtag?> GetByNameAsync(string name)
    {
        return await _context.Hashtags
            .FirstOrDefaultAsync(h => h.Name == name);
    }

    // ========================================================
    // ĐÃ FIX: Phân trang trực tiếp dưới Database
    // ========================================================
    // ========================================================
    // ĐÃ FIX: Phân trang trực tiếp dưới Database bằng Filtered Include
    // ========================================================
    public async Task<Hashtag?> GetHashtagWithPostsAsync(string name, int pageNumber = 1, int pageSize = 10)
    {
        return await _context.Hashtags
            .AsNoTracking()
            // Áp dụng Filter, Sắp xếp và Phân trang ngay trong Include đầu tiên
            .Include(h => h.PostHashtags
                .Where(ph => !ph.Post.IsDeleted)
                .OrderByDescending(ph => ph.Post.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize))
                .ThenInclude(ph => ph.Post)
                    .ThenInclude(p => p.User)

            // Các Include tiếp theo cho cùng một navigation property thì KHÔNG CẦN viết lại filter
            .Include(h => h.PostHashtags)
                .ThenInclude(ph => ph.Post)
                    .ThenInclude(p => p.MediaItems)

            .FirstOrDefaultAsync(h => h.Name == name);
    }

    public async Task IncrementUsageAsync(string hashtagName)
    {
        var hashtag = await _context.Hashtags
            .FirstOrDefaultAsync(h => h.Name == hashtagName);

        if (hashtag != null)
        {
            hashtag.IncrementUsage();
            await _context.SaveChangesAsync();
        }
    }

    // SocialGraphPlatform.Infrastructure/Repositories/HashtagRepository.cs

    public async Task<List<(string Name, int Count)>> GetTrendingHashtagsByDateAsync(int count, DateTimeOffset sinceDate, DateTimeOffset? untilDate = null)
    {
        var query = _context.PostHashtags
            .AsNoTracking()
            .Where(ph => ph.Post.CreatedAt >= sinceDate && !ph.Post.IsDeleted);

        if (untilDate.HasValue)
            query = query.Where(ph => ph.Post.CreatedAt < untilDate.Value);

        var result = await query
            .GroupBy(ph => ph.Hashtag.Name)
            .Select(g => new
            {
                Name = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(count)
            .ToListAsync();

        return result.Select(x => (x.Name, x.Count)).ToList();
    }


}