// SocialGraphPlatform.Application/Interfaces/INotificationService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.Interfaces;

public interface INotificationService
{
    // ======================== TRUY VẤN & HIỂN THỊ ========================

    /// <summary>
    /// Lấy danh sách thông báo của người dùng hiện tại (phân trang, hỗ trợ lọc theo loại và trạng thái đọc).
    /// </summary>
    Task<ApiResponse<PagedResult<NotificationResponseDto>>> GetNotificationsAsync(
        Guid currentUserId,
        int pageNumber = 1,
        int pageSize = 20,
        NotificationType? typeFilter = null,
        bool? unreadOnly = null);

    /// <summary>
    /// Lấy chi tiết một thông báo (kèm kiểm tra quyền sở hữu).
    /// </summary>
    Task<ApiResponse<NotificationResponseDto>> GetByIdAsync(Guid currentUserId, Guid notificationId);

    /// <summary>
    /// Lấy số lượng thông báo chưa đọc (dùng cho badge đỏ).
    /// </summary>
    Task<ApiResponse<int>> GetUnreadCountAsync(Guid currentUserId);

    // ======================== THAO TÁC TRẠNG THÁI ========================

    /// <summary>
    /// Đánh dấu thông báo đã đọc (hỗ trợ đánh dấu nhiều hoặc tất cả).
    /// </summary>
    Task<ApiResponse> MarkAsReadAsync(Guid currentUserId, MarkAsReadDto request);

    // ======================== TẠO MỚI & CHỐNG SPAM ========================

    /// <summary>
    /// Tạo một thông báo mới, tự động kiểm tra cài đặt, danh sách mute và chống spam.
    /// Trả về thông báo đã tạo (hoặc null nếu bị lọc).
    /// </summary>
    Task<ApiResponse<NotificationResponseDto?>> CreateNotificationAsync(CreateNotificationDto request);

    /// <summary>
    /// Tạo nhiều thông báo cùng lúc (hàng loạt), hữu ích cho thông báo hệ thống.
    /// </summary>
    Task<ApiResponse> BulkCreateNotificationsAsync(IEnumerable<CreateNotificationDto> requests);

    // ======================== DỌN DẸP ========================

    /// <summary>
    /// Xóa các thông báo đã đọc quá hạn của người dùng hiện tại.
    /// Trả về số lượng đã xóa.
    /// </summary>
    Task<ApiResponse<int>> DeleteOldNotificationsAsync(Guid currentUserId, int olderThanDays);
}