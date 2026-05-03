// SocialGraphPlatform.Domain/Entities/PushNotificationLog.cs

using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Ghi nhận lịch sử gửi push notification.
    /// Hữu ích cho debug và analytics.
    /// </summary>
    public class PushNotificationLog : AuditableEntity
    {
        public Guid UserId { get; private set; }
        public Guid? NotificationId { get; private set; }
        public string DeviceToken { get; private set; } = string.Empty;
        public DevicePlatform Platform { get; private set; }
        public PushStatus Status { get; private set; }
        public string? ErrorMessage { get; private set; }
        public DateTimeOffset SentAt { get; private set; }

        public virtual User User { get; private set; } = null!;
        public virtual Notification? Notification { get; private set; }

        protected PushNotificationLog() { }

        public PushNotificationLog(Guid userId, Guid? notificationId, string deviceToken, DevicePlatform platform)
        {
            UserId = userId;
            NotificationId = notificationId;
            DeviceToken = deviceToken;
            Platform = platform;
            SentAt = DateTimeOffset.UtcNow;
            Status = PushStatus.Pending;
        }

        public void MarkSuccess()
        {
            Status = PushStatus.Success;
        }

        public void MarkFailed(string errorMessage)
        {
            Status = PushStatus.Failed;
            ErrorMessage = errorMessage;
        }
    }

    public enum PushStatus
    {
        Pending = 1,
        Success = 2,
        Failed = 3
    }
}