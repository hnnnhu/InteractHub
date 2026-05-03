// SocialGraphPlatform.Domain.Entities/SavedPost.cs
using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Lưu bài viết (SavedPost).
    /// Áp dụng kế thừa AuditableEntity để tự động quản lý ngày tạo/sửa và người thực hiện.
    /// </summary>
    public class SavedPost : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        public Guid UserId { get; private set; }
        public Guid PostId { get; private set; }
        public string CollectionName { get; private set; } = "Mặc định";

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual User User { get; private set; } = null!;
        public virtual Post Post { get; private set; } = null!;

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        protected SavedPost() { }

        public SavedPost(Guid userId, Guid postId, string collectionName = "Mặc định")
        {
            if (userId == Guid.Empty) throw new ArgumentException("UserId không hợp lệ.");
            if (postId == Guid.Empty) throw new ArgumentException("PostId không hợp lệ.");

            if (string.IsNullOrWhiteSpace(collectionName))
                throw new ArgumentException("Tên bộ sưu tập không được để trống.");

            UserId = userId;
            PostId = postId;
            CollectionName = collectionName.Trim();

            // Khởi tạo dấu vết tạo bản ghi
            SetCreatedBy(userId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Cập nhật tên bộ sưu tập (Dùng cho chức năng đổi tên hàng loạt hoặc sửa lẻ)
        /// </summary>
        /// <param name="newName">Tên mới</param>
        /// <param name="updaterId">ID người thực hiện</param>
        public void UpdateCollection(string newName, Guid updaterId)
        {
            // [KIỂM TRA QUYỀN]: Chỉ chủ sở hữu mới có quyền sửa bộ sưu tập của họ
            if (updaterId != UserId)
                throw new InvalidOperationException("Bạn không có quyền chỉnh sửa bài lưu của người khác.");

            // [KIỂM TRA HỢP LỆ]: Không âm thầm bỏ qua, phải báo lỗi nếu tên trống
            if (string.IsNullOrWhiteSpace(newName))
                throw new ArgumentException("Tên bộ sưu tập mới không được để trống.");

            CollectionName = newName.Trim();

            // [CẬP NHẬT AUDIT]: Tự động cập nhật UpdatedAt và UpdatedBy qua AuditableEntity
            SetUpdated(updaterId);
        }

        /// <summary>
        /// Bỏ lưu bài viết (Soft Delete)
        /// </summary>
        public void Unsave(Guid userId)
        {
            if (userId != UserId)
                throw new InvalidOperationException("Bạn không có quyền bỏ lưu bài viết của người khác.");

            // SoftDelete() bên trong AuditableEntity/BaseEntity thường đã bao gồm SetUpdated
            SoftDelete(userId);
        }

        /// <summary>
        /// Khôi phục lưu bài viết (Sau khi đã Unsave)
        /// Tái sử dụng bản ghi cũ để tránh lỗi vỡ Unique Index trong DB.
        /// </summary>
        public void SaveAgain(Guid userId)
        {
            if (userId != UserId)
                throw new InvalidOperationException("Không có quyền thao tác trên bản ghi này.");

            // Nếu đang ở trạng thái không bị xóa thì không cần khôi phục
            if (!IsDeleted) return;

            // Khôi phục trạng thái bản ghi
            IsDeleted = false;

            // Cập nhật dấu vết người khôi phục
            SetUpdated(userId);
        }

        /// <summary>
        /// Di chuyển bài viết sang bộ sưu tập khác (Alias cho UpdateCollection để nghiệp vụ rõ ràng hơn)
        /// </summary>
        public void MoveToCollection(string newCollectionName, Guid updaterId)
        {
            UpdateCollection(newCollectionName, updaterId);
        }
    }
}