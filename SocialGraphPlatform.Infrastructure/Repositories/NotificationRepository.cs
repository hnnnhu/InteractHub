// SocialGraphPlatform.Infrastructure/Repositories/NotificationRepository.cs

using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class NotificationRepository : GenericRepository<Notification>, INotificationRepository
{
    public NotificationRepository(AppDbContext context) : base(context) { }

    // ======================== TRUY VẤN CƠ BẢN ========================

    public async Task<PagedResult<Notification>> GetNotificationsAsync(
        Guid receiverId,
        int pageNumber,
        int pageSize,
        NotificationType? typeFilter = null,
        bool? unreadOnly = null)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.ReceiverId == receiverId && !n.IsDeleted)
            .Include(n => n.TriggeredBy)
            .AsQueryable();

        // Lọc theo loại thông báo
        if (typeFilter.HasValue)
        {
            query = query.Where(n => n.Type == typeFilter.Value);
        }

        // Lọc chỉ thông báo chưa đọc / đã đọc
        if (unreadOnly.HasValue && unreadOnly.Value)
        {
            query = query.Where(n => !n.IsRead); // chỉ lọc khi unreadOnly=true
        }
        query = query.OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Notification>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<Notification?> GetByIdAndReceiverAsync(Guid notificationId, Guid receiverId)
    {
        return await _context.Notifications
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.ReceiverId == receiverId && !n.IsDeleted);
    }

    public async Task<int> GetUnreadCountAsync(Guid receiverId)
    {
        return await _context.Notifications
            .CountAsync(n => n.ReceiverId == receiverId && !n.IsRead && !n.IsDeleted);
    }

    // ======================== ĐÁNH DẤU ĐÃ ĐỌC ========================

    public async Task MarkAsReadAsync(Guid receiverId, List<Guid>? notificationIds = null, bool markAll = false)
    {
        var query = _context.Notifications
            .Where(n => n.ReceiverId == receiverId && !n.IsRead && !n.IsDeleted);

        if (!markAll && notificationIds?.Any() == true)
        {
            query = query.Where(n => notificationIds.Contains(n.Id));
        }

        var notifications = await query.ToListAsync();

        foreach (var notification in notifications)
        {
            notification.MarkAsRead(receiverId);
        }

        await _context.SaveChangesAsync();
    }

    // ======================== TẠO MỚI & CHỐNG SPAM ========================

    public async Task AddNotificationAsync(Notification notification)
    {
        // Kiểm tra ràng buộc cơ bản (tránh gửi cho chính mình) – có thể bỏ qua nếu entity tự xử lý
        if (notification.ReceiverId == notification.TriggeredById)
            return;

        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();
    }

    public async Task BulkAddNotificationsAsync(IEnumerable<Notification> notifications)
    {
        var validNotifications = notifications.Where(n => n.ReceiverId != n.TriggeredById);
        if (!validNotifications.Any())
            return;

        await _context.Notifications.AddRangeAsync(validNotifications);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasRecentSimilarNotificationAsync(
        Guid receiverId,
        Guid? triggeredById,
        NotificationType type,
        Guid? relatedEntityId,
        int withinSeconds = 60)
    {
        var threshold = DateTimeOffset.UtcNow.AddSeconds(-withinSeconds);
        var query = _context.Notifications
            .Where(n => n.ReceiverId == receiverId
                        && n.Type == type
                        && !n.IsDeleted
                        && n.CreatedAt >= threshold);

        if (triggeredById.HasValue)
            query = query.Where(n => n.TriggeredById == triggeredById.Value);
        else
            query = query.Where(n => n.TriggeredById == null);

        if (relatedEntityId.HasValue)
            query = query.Where(n => n.RelatedEntityId == relatedEntityId.Value);
        else
            query = query.Where(n => n.RelatedEntityId == null);

        return await query.AnyAsync();
    }

    // ======================== GỘP NHÓM (GROUPING) ========================

    public async Task<Notification?> GetUnreadGroupableNotificationAsync(
        Guid receiverId,
        NotificationType type,
        Guid? relatedEntityId)
    {
        // Ưu tiên lấy thông báo chưa đọc gần nhất để cập nhật nội dung gộp
        return await _context.Notifications
            .Where(n => n.ReceiverId == receiverId
                        && n.Type == type
                        && !n.IsRead
                        && !n.IsDeleted
                        && n.RelatedEntityId == relatedEntityId)
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateNotificationContentAsync(Guid notificationId, string newContent, string? newTargetUrl = null)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification == null || notification.IsDeleted)
            return;

        // Cập nhật nội dung và đường dẫn (giữ nguyên các trường khác)
        _context.Entry(notification).Property(n => n.Content).CurrentValue = newContent;
        if (newTargetUrl != null)
            _context.Entry(notification).Property(n => n.TargetUrl).CurrentValue = newTargetUrl;

        // Dùng AuditableEntity để ghi nhận người cập nhật (hệ thống)
        notification.SetUpdated(Guid.Empty); // Guid.Empty đại diện cho hệ thống
        await _context.SaveChangesAsync();
    }

    // ======================== DỌN DẸP ========================

    public async Task<int> DeleteOldNotificationsAsync(Guid receiverId, int olderThanDays)
    {
        var threshold = DateTimeOffset.UtcNow.AddDays(-olderThanDays);
        var count = await _context.Notifications
            .Where(n => n.ReceiverId == receiverId
                        && n.IsRead
                        && !n.IsDeleted
                        && n.CreatedAt <= threshold)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsDeleted, true));

        return count;
    }

    public async Task<int> CleanupOldNotificationsGlobalAsync(int olderThanDays)
    {
        var threshold = DateTimeOffset.UtcNow.AddDays(-olderThanDays);
        var count = await _context.Notifications
            .Where(n => n.IsRead
                        && !n.IsDeleted
                        && n.CreatedAt <= threshold)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsDeleted, true));

        return count;
    }

    // ======================== HỖ TRỢ CACHE ========================

    public Task InvalidateUnreadCountCacheAsync(Guid receiverId)
    {
        // TODO: Tích hợp Redis cache nếu dùng. Hiện tại chỉ là no-op.
        return Task.CompletedTask;
    }
}