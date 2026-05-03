// SocialGraphPlatform.Application/Interfaces/Repositories/IStoryRepository.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IStoryRepository : IGenericRepository<Story>
{
    /// <summary>
    /// Lấy chi tiết Story kèm thông tin tác giả và toàn bộ danh sách lượt xem.
    /// Dùng để kiểm tra trạng thái, quyền sở hữu và ngăn chặn duplicate view.
    /// </summary>
    /// <param name="storyId">ID của Story cần lấy.</param>
    /// <returns>Story kèm User và Views, hoặc null nếu không tồn tại / đã xóa.</returns>
    Task<Story?> GetStoryWithDetailsAsync(Guid storyId);

    /// <summary>
    /// Lấy tất cả Story đang active của một user (dùng cho "My Stories").
    /// <para><b>Yêu cầu bắt buộc:</b> Phải Include cả <c>User</c> và <c>Views</c> 
    /// để tính đúng ViewCount, UnviewedCount và hiển thị thông tin tác giả.</para>
    /// </summary>
    /// <param name="userId">ID của chủ sở hữu Story.</param>
    /// <returns>Danh sách Story còn hạn, chưa bị xóa, sắp xếp theo thời gian tạo tăng dần.</returns>
    Task<List<Story>> GetActiveStoriesByUserAsync(Guid userId);

    /// <summary>
    /// Lấy Story Feed của bạn bè (những Story đang active của bạn bè + của chính mình).
    /// <para><b>Chú ý hiệu năng:</b> Để tránh tải toàn bộ lượt xem của tất cả story vào bộ nhớ,
    /// implementation chỉ nên Include các lượt xem của <paramref name="currentUserId"/> 
    /// (dùng filtered include nếu EF Core hỗ trợ) hoặc dùng projection. 
    /// Mục đích là xác định trạng thái đã xem của người dùng hiện tại.</para>
    /// </summary>
    /// <param name="currentUserId">ID của người dùng hiện tại đang xem feed.</param>
    /// <returns>
    /// Danh sách tất cả Story hợp lệ (active, chưa xóa) của bạn bè và bản thân,
    /// bao gồm thông tin User và các lượt xem cần thiết.
    /// </returns>
    Task<List<Story>> GetActiveStoriesFeedAsync(Guid currentUserId);

    /// <summary>
    /// Kiểm tra một Story còn active (chưa hết hạn và chưa bị xóa mềm).
    /// </summary>
    /// <param name="storyId">ID của Story.</param>
    /// <returns>True nếu Story hợp lệ và còn thời hạn, ngược lại False.</returns>
    Task<bool> IsStoryActiveAsync(Guid storyId);

    /// <summary>
    /// Lấy danh sách lượt xem của một Story (phân trang).
    /// Chỉ tác giả của Story mới được phép truy vấn (kiểm tra ở tầng Service).
    /// </summary>
    /// <param name="storyId">ID của Story.</param>
    /// <param name="pageNumber">Số trang (bắt đầu từ 1).</param>
    /// <param name="pageSize">Kích thước trang.</param>
    /// <returns>Kết quả phân trang các bản ghi StoryView, kèm thông tin người xem.</returns>
    Task<PagedResult<StoryView>> GetStoryViewsAsync(Guid storyId, int pageNumber, int pageSize);

    /// <summary>
    /// Lấy số lượt xem thực tế cho một tập hợp story (batch query, tránh N+1).
    /// </summary>
    /// <param name="storyIds">Danh sách ID của các Story cần đếm.</param>
    /// <returns>Từ điển ánh xạ StoryId → tổng số lượt xem thực tế (không filter).</returns>
    Task<Dictionary<Guid, int>> GetViewCountsAsync(IEnumerable<Guid> storyIds);
}