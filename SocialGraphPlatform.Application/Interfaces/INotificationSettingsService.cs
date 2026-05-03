// SocialGraphPlatform.Application/Interfaces/INotificationSettingsService.cs

using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.Interfaces;

/// <summary>
/// Dịch vụ kiểm tra và quản lý cài đặt thông báo của người dùng.
/// </summary>
public interface INotificationSettingsService
{
    /// <summary>
    /// Kiểm tra xem một người dùng có cho phép nhận thông báo loại cụ thể hay không.
    /// </summary>
    /// <param name="userId">Id người nhận.</param>
    /// <param name="type">Loại thông báo cần kiểm tra.</param>
    /// <returns>True nếu được phép gửi, ngược lại false.</returns>
    Task<bool> CanSendNotificationAsync(Guid userId, NotificationType type);

    /// <summary>
    /// Lấy cài đặt thông báo đầy đủ của người dùng.
    /// </summary>
    Task<NotificationSettingsDto?> GetSettingsAsync(Guid userId);

    /// <summary>
    /// Cập nhật cài đặt thông báo.
    /// </summary>
    Task UpdateSettingsAsync(Guid userId, NotificationSettingsDto settings);
}