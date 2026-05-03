// SocialGraphPlatform.Application/Interfaces/Repositories/INotificationRepository.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface INotificationRepository : IGenericRepository<Notification>
{
    // ======================== TRUY VẤN CƠ BẢN ========================

    /// <summary>
    /// Lấy danh sách thông báo có phân trang, hỗ trợ lọc theo loại và trạng thái đọc.
    /// </summary>
    Task<PagedResult<Notification>> GetNotificationsAsync(
        Guid receiverId,
        int pageNumber,
        int pageSize,
        NotificationType? typeFilter = null,
        bool? unreadOnly = null);

    /// <summary>
    /// Lấy một thông báo theo Id và kiểm tra quyền sở hữu (receiver).
    /// </summary>
    Task<Notification?> GetByIdAndReceiverAsync(Guid notificationId, Guid receiverId);

    /// <summary>
    /// Đếm số lượng thông báo chưa đọc.
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid receiverId);

    // ======================== ĐÁNH DẤU ĐÃ ĐỌC ========================

    /// <summary>
    /// Đánh dấu một tập hợp thông báo (hoặc tất cả) là đã đọc.
    /// </summary>
    Task MarkAsReadAsync(Guid receiverId, List<Guid>? notificationIds = null, bool markAll = false);

    // ======================== TẠO MỚI & CHỐNG SPAM ========================

    /// <summary>
    /// Thêm một notification mới, tự động kiểm tra ràng buộc (ví dụ không tự gửi cho mình).
    /// </summary>
    Task AddNotificationAsync(Notification notification);

    /// <summary>
    /// Thêm hàng loạt notification (dùng cho hệ thống gửi thông báo hàng loạt).
    /// </summary>
    Task BulkAddNotificationsAsync(IEnumerable<Notification> notifications);

    /// <summary>
    /// Kiểm tra xem có notification tương tự trong khoảng thời gian ngắn không (tránh trùng lặp).
    /// </summary>
    Task<bool> HasRecentSimilarNotificationAsync(
        Guid receiverId,
        Guid? triggeredById,
        NotificationType type,
        Guid? relatedEntityId,
        int withinSeconds = 60);

    // ======================== GỘP NHÓM (GROUPING) ========================

    /// <summary>
    /// Lấy một notification chưa đọc có cùng loại và thực thể liên quan để cập nhật nội dung gộp.
    /// </summary>
    Task<Notification?> GetUnreadGroupableNotificationAsync(
        Guid receiverId,
        NotificationType type,
        Guid? relatedEntityId);

    /// <summary>
    /// Cập nhật nội dung của notification (dùng cho gộp nhóm, thay đổi content/targetUrl).
    /// </summary>
    Task UpdateNotificationContentAsync(Guid notificationId, string newContent, string? newTargetUrl = null);

    // ======================== DỌN DẸP ========================

    /// <summary>
    /// Xóa mềm (hoặc xóa cứng) các thông báo đã đọc quá hạn.
    /// </summary>
    Task<int> DeleteOldNotificationsAsync(Guid receiverId, int olderThanDays);

    /// <summary>
    /// Xóa mềm hàng loạt thông báo cũ trên toàn hệ thống (job định kỳ).
    /// </summary>
    Task<int> CleanupOldNotificationsGlobalAsync(int olderThanDays);

    // ======================== HỖ TRỢ CACHE ========================

    /// <summary>
    /// Tăng/giảm unread count trong cache (nếu dùng Redis) – không bắt buộc implement.
    /// </summary>
    Task InvalidateUnreadCountCacheAsync(Guid receiverId);
}