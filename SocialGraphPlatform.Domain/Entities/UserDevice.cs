// SocialGraphPlatform.Domain/Entities/UserDevice.cs

using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thiết bị đã đăng ký nhận push notification của người dùng.
    /// </summary>
    public class UserDevice : AuditableEntity
    {
        public Guid UserId { get; private set; }
        public string DeviceToken { get; private set; } = string.Empty;
        public DevicePlatform Platform { get; private set; }  // iOS, Android, Web
        public bool IsActive { get; private set; } = true;
        public DateTimeOffset LastUsedAt { get; private set; }

        public virtual User User { get; private set; } = null!;

        protected UserDevice() { }

        public UserDevice(Guid userId, string deviceToken, DevicePlatform platform)
        {
            UserId = userId;
            DeviceToken = deviceToken;
            Platform = platform;
            LastUsedAt = DateTimeOffset.UtcNow;
        }

        public void Deactivate()
        {
            IsActive = false;
            SetUpdated(UserId);
        }

        public void UpdateLastUsed()
        {
            LastUsedAt = DateTimeOffset.UtcNow;
        }
    }

    public enum DevicePlatform
    {
        iOS = 1,
        Android = 2,
        Web = 3
    }
}