using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.SavedPost;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class SavedPostRepository : GenericRepository<SavedPost>, ISavedPostRepository
{
    public SavedPostRepository(AppDbContext context) : base(context) { }

    // ==========================================
    // 1. CÁC HÀM TƯƠNG TÁC VỚI BÀI VIẾT ĐÃ LƯU
    // ==========================================

    /// <summary>
    /// Kiểm tra bài viết đã được lưu trong bộ sưu tập cụ thể chưa (Chỉ tính bản ghi chưa bị xóa)
    /// </summary>
    public async Task<bool> IsPostSavedAsync(Guid userId, Guid postId, string? collectionName = null)
    {
        var query = _context.SavedPosts
            .Where(sp => sp.UserId == userId && sp.PostId == postId && !sp.IsDeleted);

        if (!string.IsNullOrEmpty(collectionName))
            query = query.Where(sp => sp.CollectionName == collectionName);

        return await query.AnyAsync();
    }

    /// <summary>
    /// Lấy bản ghi lưu bài viết cụ thể của người dùng (Chỉ lấy bản ghi đang active)
    /// </summary>
    public async Task<SavedPost?> GetSavedPostAsync(Guid userId, Guid postId)
    {
        return await _context.SavedPosts
            .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.PostId == postId && !sp.IsDeleted);
    }

    /// <summary>
    /// [QUAN TRỌNG - SỬA LỖI UNIQUE INDEX]: Lấy bản ghi lưu bài viết BẤT KỂ trạng thái IsDeleted.
    /// Bổ sung IgnoreQueryFilters() để bỏ qua Global Query Filter của EF Core.
    /// </summary>
    public async Task<SavedPost?> GetSavedPostIncludingDeletedAsync(Guid userId, Guid postId)
    {
        return await _context.SavedPosts
            .IgnoreQueryFilters() // Yêu cầu EF Core không áp dụng bộ lọc !sp.IsDeleted
            .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.PostId == postId);
    }

    /// <summary>
    /// Lấy danh sách bài viết đã lưu có phân trang, hỗ trợ lọc theo bộ sưu tập
    /// </summary>
    public async Task<PagedResult<SavedPost>> GetSavedPostsAsync(
        Guid userId, string? collectionName, int pageNumber, int pageSize)
    {
        IQueryable<SavedPost> query = _context.SavedPosts
            .AsNoTracking()
            .Where(sp => sp.UserId == userId && !sp.IsDeleted)
            .Include(sp => sp.Post)
                .ThenInclude(p => p.User)
            .Include(sp => sp.Post)
                .ThenInclude(p => p.MediaItems);

        if (!string.IsNullOrEmpty(collectionName))
            query = query.Where(sp => sp.CollectionName == collectionName);

        var orderedQuery = query.OrderByDescending(sp => sp.CreatedAt);

        var totalCount = await orderedQuery.CountAsync();

        var items = await orderedQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<SavedPost>(items, pageNumber, pageSize, totalCount);
    }

    /// <summary>
    /// Lấy toàn bộ danh sách SavedPost của một bộ sưu tập
    /// </summary>
    public async Task<List<SavedPost>> GetSavedPostsByCollectionAsync(Guid userId, string collectionName)
    {
        return await _context.SavedPosts
            .Where(sp => sp.UserId == userId
                         && sp.CollectionName == collectionName
                         && !sp.IsDeleted)
            .ToListAsync();
    }


    // ==========================================
    // 2. CÁC HÀM QUẢN LÝ BỘ SƯU TẬP (COLLECTION)
    // ==========================================

    /// <summary>
    /// Lấy danh sách các bộ sưu tập kèm theo thông tin tổng quan và ảnh xem trước
    /// </summary>
    public async Task<List<CollectionDto>> GetCollectionsAsync(Guid userId)
    {
        // 1. Lấy danh sách tên collection (Kể cả collection trống)
        var collections = await _context.SavedPostCollections
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var result = new List<CollectionDto>();

        // 2. Lấy số lượng và Preview Images cho từng Collection
        foreach (var c in collections)
        {
            var savedPostsQuery = _context.SavedPosts
                .Where(sp => sp.UserId == userId && sp.CollectionName == c.Name && !sp.IsDeleted)
                .OrderByDescending(sp => sp.CreatedAt);

            var count = await savedPostsQuery.CountAsync();

            // ĐÃ FIX LỖI BIÊN DỊCH: Đổi (DateTime?)null thành (DateTimeOffset?)null
            var lastSavedAt = count > 0 ? await savedPostsQuery.MaxAsync(sp => sp.CreatedAt) : (DateTimeOffset?)null;

            var previews = await savedPostsQuery
                .Include(sp => sp.Post)
                    .ThenInclude(p => p.MediaItems)
                .Take(4)
                .Select(sp => new SavedPostSummaryDto
                {
                    PostId = sp.PostId,
                    MediaUrl = sp.Post.MediaItems != null && sp.Post.MediaItems.Any()
                        ? sp.Post.MediaItems.OrderBy(m => m.SortOrder).First().MediaUrl
                        : null,
                    SavedAt = sp.CreatedAt
                }).ToListAsync();

            result.Add(new CollectionDto
            {
                Name = c.Name,
                SavedPostCount = count,
                LastSavedAt = lastSavedAt,
                PreviewPosts = previews
            });
        }

        return result;
    }

    /// <summary>
    /// Kiểm tra sự tồn tại của một bộ sưu tập
    /// </summary>
    public async Task<bool> CollectionExistsAsync(Guid userId, string collectionName)
    {
        return await _context.SavedPostCollections
            .AnyAsync(c => c.UserId == userId && c.Name == collectionName);
    }

    /// <summary>
    /// Thêm bộ sưu tập mới vào DB
    /// </summary>
    public async Task CreateUserCollectionAsync(Guid userId, string collectionName)
    {
        var newCollection = new SavedPostCollection
        {
            UserId = userId,
            Name = collectionName
        };
        await _context.SavedPostCollections.AddAsync(newCollection);
    }

    /// <summary>
    /// Cập nhật tên bộ sưu tập trong DB
    /// </summary>
    public async Task UpdateUserCollectionNameAsync(Guid userId, string oldName, string newName)
    {
        var collection = await _context.SavedPostCollections
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Name == oldName);

        if (collection != null)
        {
            collection.Name = newName;
            _context.SavedPostCollections.Update(collection);
        }
    }

    /// <summary>
    /// Xóa trắng bộ sưu tập khỏi DB
    /// </summary>
    public async Task DeleteUserCollectionAsync(Guid userId, string collectionName)
    {
        var collection = await _context.SavedPostCollections
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Name == collectionName);

        if (collection != null)
        {
            _context.SavedPostCollections.Remove(collection);
        }
    }
}