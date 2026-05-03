// SocialGraphPlatform.Application/Interfaces/Repositories/IHashtagRepository.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Hashtag;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IHashtagRepository : IGenericRepository<Hashtag>
{
    /// <summary>
    /// Tìm kiếm hashtag theo từ khóa với phân trang và sắp xếp
    /// </summary>
    Task<PagedResult<Hashtag>> SearchHashtagsAsync(HashtagSearchDto request);

    /// <summary>
    /// Lấy danh sách hashtag trending dựa trên tổng UsageCount
    /// </summary>
    Task<List<Hashtag>> GetTrendingHashtagsAsync(int count = 10);

    /// <summary>
    /// Lấy thông tin cơ bản của một hashtag theo tên (Dùng để kiểm tra tồn tại)
    /// </summary>
    Task<Hashtag?> GetByNameAsync(string name);

    /// <summary>
    /// Lấy chi tiết một hashtag kèm theo danh sách bài viết liên quan (Phân trang Server-side)
    /// </summary>
    Task<Hashtag?> GetHashtagWithPostsAsync(string name, int pageNumber = 1, int pageSize = 10);

    /// <summary>
    /// Tăng số lượng sử dụng của hashtag khi có bài viết mới
    /// </summary>
    Task IncrementUsageAsync(string hashtagName);

    /// <summary>
    /// Thống kê hashtag được dùng nhiều nhất trong một khoảng thời gian (Dùng để tính vận tốc tăng trưởng)
    /// </summary>
    Task<List<(string Name, int Count)>> GetTrendingHashtagsByDateAsync(int count, DateTimeOffset sinceDate, DateTimeOffset? untilDate = null);
}