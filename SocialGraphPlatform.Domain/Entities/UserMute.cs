using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    public class UserMute : AuditableEntity
    {
        public Guid UserId { get; private set; }
        public Guid MutedUserId { get; private set; }
        public DateTimeOffset? MuteEnd { get; private set; }

        public virtual User User { get; private set; } = null!;
        public virtual User MutedUser { get; private set; } = null!;

        protected UserMute() { } // Cho EF Core

        public UserMute(Guid userId, Guid mutedUserId, DateTimeOffset? muteEnd = null)
        {
            UserId = userId;
            MutedUserId = mutedUserId;
            MuteEnd = muteEnd;
        }

        public bool IsActive(DateTimeOffset now)
        {
            if (!MuteEnd.HasValue) return true;
            return now < MuteEnd.Value;
        }
    }
}