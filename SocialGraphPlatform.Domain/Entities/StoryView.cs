using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Lượt xem Tin 24h (StoryView).
    /// Đây là một thực thể bất biến (Immutable), chỉ được tạo ra và đọc, không có nghiệp vụ cập nhật.
    /// Thời gian xem (ViewedAt) chính là thuộc tính CreatedAt được kế thừa từ AuditableEntity.
    /// </summary>
    public class StoryView : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        /// <summary>Khóa ngoại: Trỏ tới Story đang được xem</summary>
        public Guid StoryId { get; private set; }

        /// <summary>Khóa ngoại: Trỏ tới người dùng đã xem Story này</summary>
        public Guid ViewerId { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual Story Story { get; private set; } = null!;
        public virtual User Viewer { get; private set; } = null!;

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        /// <summary>
        /// Constructor mặc định cho Entity Framework Core
        /// </summary>
        protected StoryView() { }

        /// <summary>
        /// Constructor dùng để ghi nhận một lượt xem mới.
        /// Constructor này sẽ được gọi bên trong hàm story.AddView(...) mà chúng ta vừa viết lúc nãy.
        /// </summary>
        public StoryView(Guid storyId, Guid viewerId)
        {
            if (storyId == Guid.Empty)
                throw new ArgumentException("StoryId không được để trống", nameof(storyId));

            if (viewerId == Guid.Empty)
                throw new ArgumentException("ViewerId không được để trống", nameof(viewerId));

            StoryId = storyId;
            ViewerId = viewerId;

            // Người tạo ra bản ghi này chính là người xem
            // Thời gian xem chính là thời gian hệ thống sinh ra CreatedAt ở class cha
            SetCreatedBy(viewerId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        // CỐ Ý BỎ TRỐNG: 
        // Không có hàm Update ở đây vì bạn không thể "chỉnh sửa" một lượt xem trong quá khứ.
        // Khi Story hết hạn hoặc bị xóa, bản ghi này sẽ tự động bị dọn dẹp theo cấu hình Cascade Delete ở tầng DbContext.
    }
}