using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    public class NotificationSettings : AuditableEntity
    {
        public Guid UserId { get; private set; }
        public bool EnableAllNotifications { get; private set; } = true;
        public bool FriendRequest { get; private set; } = true;
        public bool FriendAccepted { get; private set; } = true;
        public bool PostReaction { get; private set; } = true;
        public bool PostComment { get; private set; } = true;
        public bool StoryReaction { get; private set; } = true;
        public bool Mention { get; private set; } = true;
        public bool PushEnabled { get; private set; } = true;
        public bool QuietHoursEnabled { get; private set; } = false;
        public int QuietHoursStart { get; private set; } = 22;
        public int QuietHoursEnd { get; private set; } = 7;
        public bool EnableEmailNotification { get; private set; } = false;

        public virtual User User { get; private set; } = null!;

        // Constructor mặc định cho EF Core
        protected NotificationSettings() { }

        // Public constructor để khởi tạo cho user mới
        public NotificationSettings(Guid userId)
        {
            UserId = userId;
        }

        public void UpdateFromDto(bool enableAll, bool friendReq, bool friendAccept,
            bool postReact, bool postComment, bool storyReact, bool mention,
            bool pushEnabled, bool quietHoursEnabled, int quietStart, int quietEnd,
            bool enableEmail)
        {
            EnableAllNotifications = enableAll;
            FriendRequest = friendReq;
            FriendAccepted = friendAccept;
            PostReaction = postReact;
            PostComment = postComment;
            StoryReaction = storyReact;
            Mention = mention;
            PushEnabled = pushEnabled;
            QuietHoursEnabled = quietHoursEnabled;
            QuietHoursStart = quietStart;
            QuietHoursEnd = quietEnd;
            EnableEmailNotification = enableEmail;
            SetUpdated(UserId);
        }

        public bool IsTypeEnabled(Enums.NotificationType type)
        {
            if (!EnableAllNotifications) return false;
            return type switch
            {
                Enums.NotificationType.FriendRequest => FriendRequest,
                Enums.NotificationType.FriendAccepted => FriendAccepted,
                Enums.NotificationType.PostReaction => PostReaction,
                Enums.NotificationType.PostComment => PostComment,
                Enums.NotificationType.StoryReaction => StoryReaction,
                Enums.NotificationType.Mention => Mention,
                Enums.NotificationType.CloseFriendAdded => true, // hoặc thêm một property riêng nếu muốn tuỳ biến
                _ => true
            };
        }
    }
}