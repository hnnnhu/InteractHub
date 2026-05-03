// SocialGraphPlatform.Infrastructure/Repositories/PostRepository.cs
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Providers; // THÊM: Provider xử lý Block
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class PostRepository : GenericRepository<Post>, IPostRepository
{
    private readonly IBlockedUserProvider _blockedUserProvider;

    public PostRepository(AppDbContext context, IBlockedUserProvider blockedUserProvider)
        : base(context)
    {
        _blockedUserProvider = blockedUserProvider;
    }

    public async Task<Post?> GetPostWithDetailsAsync(Guid postId)
    {
        // Lấy danh sách ID người bị chặn
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        return await _context.Posts
            .AsNoTracking()
            .Include(p => p.MediaItems.OrderBy(m => m.SortOrder))
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
            .Include(p => p.User)
            // LỌC: Ẩn luôn bình luận của những người nằm trong Blacklist
            .Include(p => p.Comments.Where(c => !c.IsDeleted && !excludedUserIds.Contains(c.UserId)))
            .Include(p => p.Reactions)
            .Include(p => p.SavedByUsers)
            // LỌC: Không trả về chi tiết bài viết nếu bài viết đó của người đã chặn mình (hoặc mình chặn họ)
            .FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted && !excludedUserIds.Contains(p.UserId));
    }

    public async Task<PagedResult<Post>> GetNewsFeedAsync(Guid currentUserId, int pageNumber, int pageSize)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        // Lấy danh sách bạn bè (đã chấp nhận)
        var friendIds = await _context.Friendships
            .Where(f => (f.RequesterId == currentUserId || f.AddresseeId == currentUserId)
                     && f.Status == FriendshipStatus.Accepted)
            .Select(f => f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId)
            .ToListAsync();

        friendIds.Add(currentUserId); // Bài viết của chính mình

        var query = _context.Posts
            .AsNoTracking()
            .Include(p => p.MediaItems.OrderBy(m => m.SortOrder))
            .Include(p => p.User)
            .Include(p => p.Comments.Where(c => !c.IsDeleted && !excludedUserIds.Contains(c.UserId))) // Ẩn bình luận
            .Include(p => p.Reactions)
            .Include(p => p.SavedByUsers)
            .Where(p => friendIds.Contains(p.UserId))
            // THÊM: Loại bỏ bài viết của những người trong danh sách chặn
            .Where(p => !excludedUserIds.Contains(p.UserId))
            .Where(p => p.Privacy == PrivacyLevel.Public
                     || (p.Privacy == PrivacyLevel.FriendsOnly && friendIds.Contains(p.UserId)))
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Post>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<PagedResult<Post>> GetUserPostsAsync(Guid userId, int pageNumber, int pageSize)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        // CHẶN NHANH: Nếu user đang cố gắng xem tường nhà của người họ chặn (hoặc bị chặn), trả về danh sách rỗng.
        if (excludedUserIds.Contains(userId))
        {
            return new PagedResult<Post>(new List<Post>(), pageNumber, pageSize, 0);
        }

        var query = _context.Posts
            .AsNoTracking()
            .Include(p => p.MediaItems.OrderBy(m => m.SortOrder))
            .Include(p => p.User)
            .Include(p => p.Comments.Where(c => !c.IsDeleted && !excludedUserIds.Contains(c.UserId)))
            .Include(p => p.Reactions)
            .Include(p => p.SavedByUsers)
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Post>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<bool> CanUserViewPostAsync(Guid postId, Guid currentUserId)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();

        var postInfo = await _context.Posts
            .AsNoTracking()
            .Where(p => p.Id == postId && !p.IsDeleted)
            .Select(p => new { p.UserId, p.Privacy })
            .FirstOrDefaultAsync();

        if (postInfo == null) return false;

        // THÊM: Nếu người đăng bài bị block -> Mất quyền xem hoàn toàn
        if (excludedUserIds.Contains(postInfo.UserId)) return false;

        if (postInfo.UserId == currentUserId) return true;
        if (postInfo.Privacy == PrivacyLevel.Public) return true;

        // FriendsOnly: Chỉ bạn bè mới xem được
        if (postInfo.Privacy == PrivacyLevel.FriendsOnly)
        {
            return await _context.Friendships
                .AnyAsync(f =>
                    ((f.RequesterId == currentUserId && f.AddresseeId == postInfo.UserId) ||
                     (f.AddresseeId == currentUserId && f.RequesterId == postInfo.UserId)) &&
                    f.Status == FriendshipStatus.Accepted);
        }

        // Private hoặc CloseFriends → chỉ chủ bài viết xem được
        return false;
    }

    public async Task<bool> ExistsActiveAsync(Guid postId)
    {
        return await _context.Posts
            .AnyAsync(p => p.Id == postId && !p.IsDeleted);
    }

    // =======================================================
    // TÌM KIẾM BÀI VIẾT THEO TỪ KHÓA
    // =======================================================
    public async Task<PagedResult<Post>> SearchPostsByKeywordAsync(Guid currentUserId, string keyword, int pageNumber, int pageSize)
    {
        var excludedUserIds = await _blockedUserProvider.GetExcludedUserIdsAsync();
        var lowerKeyword = keyword.ToLower();

        var query = _context.Posts
            .AsNoTracking()
            // Chỉ lấy bài viết không bị xóa và chứa từ khóa
            .Where(p => !p.IsDeleted && p.Content != null && p.Content.ToLower().Contains(lowerKeyword))
            // THÊM: Ẩn bài viết của những người trong danh sách chặn khỏi kết quả tìm kiếm
            .Where(p => !excludedUserIds.Contains(p.UserId))
            // Chỉ hiển thị bài viết Public hoặc bài viết của chính người đang tìm kiếm
            .Where(p => p.Privacy == PrivacyLevel.Public || p.UserId == currentUserId)
            // Tải đầy đủ các bảng liên kết để ánh xạ ra DTO không bị lỗi Count = 0
            .Include(p => p.MediaItems.OrderBy(m => m.SortOrder))
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
            .Include(p => p.User)
            .Include(p => p.Comments.Where(c => !c.IsDeleted && !excludedUserIds.Contains(c.UserId)))
            .Include(p => p.Reactions)
            .Include(p => p.SavedByUsers)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Post>(items, pageNumber, pageSize, totalCount);
    }
}