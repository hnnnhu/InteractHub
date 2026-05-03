using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Hashtag;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IHashtagService
{
    // Tìm kiếm và liệt kê hashtag với phân trang và sắp xếp
    Task<ApiResponse<PagedResult<HashtagDto>>> SearchHashtagsAsync(HashtagSearchDto request);

    // Lấy danh sách các hashtag đang dẫn đầu xu hướng
    Task<ApiResponse<List<TrendingHashtagDto>>> GetTrendingHashtagsAsync(int count);

    // Lấy chi tiết một hashtag kèm theo danh sách các bài viết liên quan
    // Cần currentUserId để xác định trạng thái Like/Lưu của các bài viết trong danh sách
    Task<ApiResponse<HashtagWithPostsDto>> GetHashtagWithPostsAsync(Guid currentUserId, string name, int pageNumber, int pageSize);
    Task<ApiResponse> DeleteHashtagAsync(string name);
}

