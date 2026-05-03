// SocialGraphPlatform.Infrastructure/Repositories/CommentRepository.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Providers; // THÊM: Provider xử lý Block
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class CommentRepository : GenericRepository<Comment>, ICommentRepository
{
    private readonly IBlockedUserProvider _blockedUserProvider;

    public CommentRepository(AppDbContext context, IBlockedUserProvider blockedUserProvider)
        : base(context)
    {
        _blockedUserProvider = blockedUserProvider;
    }

    /// <summary>
    /// Lấy danh sách bình luận gốc của bài viết để phân trang
    /// </summary>
    public async Task<PagedResult<Comment>> GetCommentsByPostIdAsync(
        Guid postId, int pageNumber, int pageSize)
    {
        // 1. Lấy danh sách ID người bị chặn
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        // 2. Khởi tạo query lấy các bình luận gốc (Cấp 1)
        var query = _context.Comments
            .AsNoTracking()
            .Where(c => c.PostId == postId && c.ParentCommentId == null && !c.IsDeleted)
            // LỌC: Ẩn bình luận gốc của người bị chặn
            .Where(c => !excludedUserIds.Contains(c.UserId));

        // 3. Đếm số lượng bình luận GỐC (Cấp 1) chuẩn xác sau khi đã lọc Blacklist
        var totalRootComments = await query.CountAsync();

        // 4. Lấy dữ liệu phân trang cho bình luận gốc kèm theo thông tin User và 2 Reply đầu tiên
        var items = await query
            .Include(c => c.User)
            // LỌC TẬN GỐC: Ẩn luôn các Reply của người bị chặn trong danh sách tải trước (Take(2))
            .Include(c => c.Replies
                .Where(r => !r.IsDeleted && !excludedUserIds.Contains(r.UserId))
                .OrderBy(r => r.CreatedAt)
                .Take(2))
            .ThenInclude(r => r.User)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Comment>(items, pageNumber, pageSize, totalRootComments);
    }

    /// <summary>
    /// Lấy danh sách câu trả lời cho một bình luận cụ thể
    /// </summary>
    public async Task<PagedResult<Comment>> GetRepliesAsync(
        Guid parentCommentId, int pageNumber, int pageSize)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        var query = _context.Comments
            .AsNoTracking()
            .Where(c => c.ParentCommentId == parentCommentId && !c.IsDeleted)
            // LỌC: Ẩn câu trả lời của người bị chặn khi người dùng bấm "Xem thêm câu trả lời"
            .Where(c => !excludedUserIds.Contains(c.UserId))
            .Include(c => c.User)
            .OrderBy(c => c.CreatedAt);

        var totalRepliesForThisParent = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Comment>(items, pageNumber, pageSize, totalRepliesForThisParent);
    }

    /// <summary>
    /// Giải pháp tối ưu: Lấy bản đồ số lượng reply cho danh sách comment chỉ với 1 Query (Tránh N+1)
    /// </summary>
    public async Task<Dictionary<Guid, int>> GetReplyCountsAsync(List<Guid> commentIds)
    {
        if (commentIds == null || !commentIds.Any())
            return new Dictionary<Guid, int>();

        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        return await _context.Comments
            .Where(c => c.ParentCommentId.HasValue &&
                        commentIds.Contains(c.ParentCommentId.Value) &&
                        !c.IsDeleted)
            // LỌC: Không đếm các reply của người bị chặn vào tổng số lượng reply
            .Where(c => !excludedUserIds.Contains(c.UserId))
            .GroupBy(c => c.ParentCommentId.Value)
            .Select(g => new { CommentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CommentId, x => x.Count);
    }

    public async Task<int> GetReplyCountAsync(Guid parentCommentId)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        return await _context.Comments
            // LỌC: Đếm chính xác số lượng reply hợp lệ
            .CountAsync(c => c.ParentCommentId == parentCommentId &&
                             !c.IsDeleted &&
                             !excludedUserIds.Contains(c.UserId));
    }

    public async Task<bool> ExistsActiveAsync(Guid commentId)
    {
        // Kiểm tra tồn tại không cần lọc BlockedUser vì đây thường là logic Check nội bộ
        return await _context.Comments
            .AnyAsync(c => c.Id == commentId && !c.IsDeleted);
    }

    public async Task<bool> IsOwnerAsync(Guid commentId, Guid userId)
    {
        return await _context.Comments
            .AnyAsync(c => c.Id == commentId && c.UserId == userId && !c.IsDeleted);
    }
}