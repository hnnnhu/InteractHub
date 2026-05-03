namespace SocialGraphPlatform.Domain.Entities.Base
{
    /// <summary>
    /// Thực thể cơ sở cho tất cả entity (trừ AspNetUsers)
    /// </summary>
    public abstract class BaseEntity
    {
        /// <summary>
        /// Khóa chính - Guid được sinh tự động khi tạo entity
        /// </summary>
        public Guid Id { get; protected set; }

        protected BaseEntity()
        {
            Id = Guid.NewGuid();
        }
    }
}