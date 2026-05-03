// SocialGraphPlatform.Domain/Entities/Base/AuditableEntity.cs

namespace SocialGraphPlatform.Domain.Entities.Base
{
    /// <summary>
    /// Thực thể kiểm toán: Quản lý dấu vết lịch sử (Thời gian + Tác nhân) + Soft Delete
    /// </summary>
    public abstract class AuditableEntity : BaseEntity
    {
        // --- Thời gian (Đã nâng cấp lên DateTimeOffset chuẩn quốc tế) ---
        public DateTimeOffset CreatedAt { get; protected set; }
        public DateTimeOffset? UpdatedAt { get; protected set; }
        public DateTimeOffset? DeletedAt { get; protected set; }

        // --- Tác nhân (dùng Guid để nhất quán với BaseEntity) ---
        public Guid CreatedBy { get; protected set; }
        public Guid? UpdatedBy { get; protected set; }
        public Guid? DeletedBy { get; protected set; }

        // --- Soft Delete ---
        public bool IsDeleted { get; protected set; }

        protected AuditableEntity()
        {
            // Sử dụng DateTimeOffset.UtcNow thay vì DateTime
            CreatedAt = DateTimeOffset.UtcNow;
            IsDeleted = false;
        }

        /// <summary>Được gọi khi tạo mới entity</summary>
        public void SetCreatedBy(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("UserId cannot be empty", nameof(userId));

            CreatedBy = userId;
        }

        /// <summary>Cập nhật entity</summary>
        public void SetUpdated(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("UserId cannot be empty", nameof(userId));

            UpdatedAt = DateTimeOffset.UtcNow;
            UpdatedBy = userId;
        }

        /// <summary>Xóa mềm entity</summary>
        public void SoftDelete(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("UserId cannot be empty", nameof(userId));

            IsDeleted = true;
            DeletedAt = DateTimeOffset.UtcNow;
            DeletedBy = userId;

            // Cập nhật luôn Updated để dễ query
            UpdatedAt = DateTimeOffset.UtcNow;
            UpdatedBy = userId;
        }

        // Trong AuditableEntity.cs (hoặc lớp cơ sở của bạn)
        public void Restore()
        {
            IsDeleted = false;
            DeletedAt = null;
            DeletedBy = null;
        }
    }
}