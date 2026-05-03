using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Chặn người dùng (Block).
    /// Đây là thực thể có quyền lực cao nhất, ghi đè và chặn mọi luồng giao tiếp giữa 2 User.
    /// Áp dụng cơ chế tái sử dụng bản ghi (Restore) để tối ưu hiệu năng.
    /// </summary>
    public class Block : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        /// <summary>Khóa ngoại: Người chủ động ấn nút Chặn</summary>
        public Guid BlockerId { get; private set; }

        /// <summary>Khóa ngoại: Người bị chặn</summary>
        public Guid BlockedId { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual User Blocker { get; private set; } = null!;
        public virtual User Blocked { get; private set; } = null!;

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        protected Block() { }

        public Block(Guid blockerId, Guid blockedId)
        {
            if (blockerId == Guid.Empty || blockedId == Guid.Empty)
                throw new ArgumentException("ID người dùng không hợp lệ.");

            if (blockerId == blockedId)
                throw new InvalidOperationException("Bạn không thể tự chặn chính mình!");

            BlockerId = blockerId;
            BlockedId = blockedId;

            SetCreatedBy(blockerId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Nghiệp vụ: Gỡ chặn (Unblock)
        /// Gỡ chặn thực chất là xóa mềm (Soft Delete) bản ghi này.
        /// </summary>
        public void Unblock(Guid updaterId)
        {
            if (updaterId != BlockerId)
                throw new InvalidOperationException("Chỉ người thiết lập lệnh chặn mới có quyền gỡ bỏ nó.");

            SoftDelete(updaterId);
        }

        /// <summary>
        /// Nghiệp vụ: Chặn lại (Block Again)
        /// Khôi phục lệnh chặn cũ sau khi đã Unblock để tránh lỗi vỡ Unique Index trong Database.
        /// </summary>
        public void BlockAgain(Guid updaterId)
        {
            if (updaterId != BlockerId)
                throw new InvalidOperationException("Chỉ người thiết lập lệnh chặn mới có quyền thao tác.");

            // Nếu đang chặn bình thường (chưa bị xóa) thì không làm gì cả
            if (!IsDeleted)
                return;

            // Khôi phục lại bản ghi (Kích hoạt lại bức tường lửa)
            IsDeleted = false;
            SetUpdated(updaterId);
        }
    }
}