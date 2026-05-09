using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Story;
using SocialGraphPlatform.Application.DTOs.Stories; // Chứa StoryViewDto

namespace SocialGraphPlatform.Application.Interfaces;

public interface IStoryService
{
    // Tạo Story mới
    Task<ApiResponse<IdDto>> CreateStoryAsync(Guid currentUserId, CreateStoryDto request);

    // Xem chi tiết 1 Story (Thường dùng khi chia sẻ link trực tiếp)
    Task<ApiResponse<StoryResponseDto>> GetStoryByIdAsync(Guid currentUserId, Guid storyId);

    // Xóa Story trước thời hạn
    Task<ApiResponse> DeleteStoryAsync(Guid currentUserId, Guid storyId);

    // Lấy danh sách Story đang Active của bạn bè (Story Tray hiển thị trên đầu bảng tin)
    Task<ApiResponse<List<ActiveStoryDto>>> GetActiveStoriesFeedAsync(Guid currentUserId);

    Task<ApiResponse<ActiveStoryDto>> GetMyStoriesAsync(Guid userId); //

    // Ghi nhận lượt xem Story (Mark as viewed)
    Task<ApiResponse> MarkStoryAsViewedAsync(Guid currentUserId, Guid storyId);

    // Lấy danh sách những người đã xem Story (Chỉ tác giả mới được xem)
    Task<ApiResponse<PagedResult<StoryViewDto>>> GetStoryViewsAsync(Guid currentUserId, Guid storyId, int pageNumber, int pageSize);

}