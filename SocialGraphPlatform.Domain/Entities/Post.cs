using SocialGraphPlatform.Domain.Entities.Base;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Bài viết (Post).
    /// Kế thừa AuditableEntity để tự động có Id (Guid), các mốc thời gian và tính năng Soft Delete.
    /// </summary>
    public class Post : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        /// <summary>Khóa ngoại trỏ tới tác giả bài viết</summary>
        public Guid UserId { get; private set; }

        /// <summary>Nội dung văn bản của bài viết</summary>
        public string? Content { get; private set; }

        /// <summary>Quyền riêng tư (Công khai, Bạn bè, Chỉ mình tôi, Bạn thân)</summary>
        public PrivacyLevel Privacy { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual User User { get; private set; } = null!;
        public virtual ICollection<PostMedia> MediaItems { get; private set; } = new List<PostMedia>();
        public virtual ICollection<Comment> Comments { get; private set; } = new List<Comment>();
        public virtual ICollection<Reaction> Reactions { get; private set; } = new List<Reaction>();
        public virtual ICollection<PostHashtag> PostHashtags { get; private set; } = new List<PostHashtag>();
        public virtual ICollection<PostReport> Reports { get; private set; } = new List<PostReport>();
        public virtual ICollection<SavedPost> SavedByUsers { get; private set; } = new List<SavedPost>();

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        /// <summary>
        /// Constructor mặc định (Bắt buộc phải có để Entity Framework Core hoạt động)
        /// </summary>
        protected Post() { }

        /// <summary>
        /// Constructor dùng khi tạo bài viết mới từ Code.
        /// Ép buộc phải truyền vào UserId (Không có tác giả thì không thể có bài viết).
        /// </summary>
        public Post(Guid userId, string? content, PrivacyLevel privacy = PrivacyLevel.Public)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("UserId không được để trống", nameof(userId));

            UserId = userId;
            Content = content;
            Privacy = privacy;

            // Gọi hàm từ class cha (AuditableEntity) để ghi nhận người tạo
            SetCreatedBy(userId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Nghiệp vụ: Chỉnh sửa bài viết
        /// </summary>
        public void UpdateContent(string? newContent, PrivacyLevel newPrivacy, Guid updaterId)
        {
            Content = newContent;
            Privacy = newPrivacy;

            // Gọi hàm từ class cha (AuditableEntity) để cập nhật thời gian & người sửa
            SetUpdated(updaterId);
        }


    }
}