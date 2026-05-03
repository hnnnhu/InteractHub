using SocialGraphPlatform.Domain.Entities.Base;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Đa phương tiện của Bài viết (PostMedia).
    /// Quản lý hình ảnh, video hoặc tài liệu đính kèm bên trong một Post.
    /// Kế thừa AuditableEntity để có Id (Guid) và dấu vết lịch sử.
    /// </summary>
    public class PostMedia : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        /// <summary>Khóa ngoại trỏ tới bài viết chứa media này</summary>
        public Guid PostId { get; private set; }

        /// <summary>Đường dẫn lưu trữ file (thường là URL của Azure Blob Storage hoặc AWS S3)</summary>
        public string MediaUrl { get; private set; } = string.Empty;

        /// <summary>Phân loại định dạng file (Ảnh, Video, Tài liệu)</summary>
        public MediaType Type { get; private set; }

        /// <summary>
        /// Thứ tự hiển thị của ảnh/video (rất quan trọng khi hiển thị dạng Carousel/Album).
        /// Ví dụ: 0 là ảnh bìa, 1 2 3 là các ảnh tiếp theo.
        /// </summary>
        public int SortOrder { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual Post Post { get; private set; } = null!;

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        /// <summary>
        /// Constructor mặc định cho Entity Framework Core
        /// </summary>
        protected PostMedia() { }

        /// <summary>
        /// Constructor dùng để tạo Media mới gắn vào Post
        /// </summary>
        public PostMedia(Guid postId, string mediaUrl, MediaType type, int sortOrder, Guid creatorId)
        {
            if (postId == Guid.Empty)
                throw new ArgumentException("PostId không được để trống", nameof(postId));

            if (string.IsNullOrWhiteSpace(mediaUrl))
                throw new ArgumentException("Đường dẫn MediaUrl không được để trống", nameof(mediaUrl));

            PostId = postId;
            MediaUrl = mediaUrl;
            Type = type;
            SortOrder = sortOrder;

            // Ghi nhận ai là người upload file này (thường là tác giả của Post)
            SetCreatedBy(creatorId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Nghiệp vụ: Cập nhật lại thứ tự hiển thị của ảnh/video
        /// (Ví dụ: Người dùng kéo thả đổi vị trí ảnh trước khi bấm Lưu bài viết)
        /// </summary>
        public void UpdateSortOrder(int newSortOrder, Guid updaterId)
        {
            SortOrder = newSortOrder;

            // Ghi nhận thời gian và người vừa thực hiện thay đổi
            SetUpdated(updaterId);
        }

        // Lưu ý: Thường đối với mạng xã hội, người ta hiếm khi "Cập nhật MediaUrl" cho 1 bản ghi có sẵn.
        // Nếu người dùng muốn đổi ảnh, nghiệp vụ thực tế là XÓA (SoftDelete) bản ghi cũ và TẠO bản ghi mới.
        // Do đó, chúng ta không viết hàm UpdateMediaUrl ở đây để bảo vệ tính bất biến của file vật lý.
    }
}