using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Bình luận (Comment).
    /// Hỗ trợ cấu trúc cây (Tree structure) để làm tính năng Reply (Bình luận lồng nhau).
    /// </summary>
    public class Comment : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        /// <summary>Khóa ngoại trỏ tới bài viết được bình luận</summary>
        public Guid PostId { get; private set; }

        /// <summary>Khóa ngoại trỏ tới tác giả của bình luận</summary>
        public Guid UserId { get; private set; }

        /// <summary>Nội dung bình luận</summary>
        public string Content { get; private set; } = string.Empty;

        /// <summary>
        /// ID của bình luận cha. 
        /// Nếu là Null: Đây là bình luận cấp 1 (Gốc).
        /// Nếu có giá trị: Đây là bình luận cấp 2 (Reply).
        /// </summary>
        public Guid? ParentCommentId { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual Post Post { get; private set; } = null!;
        public virtual User User { get; private set; } = null!;

        // Liên kết tự tham chiếu (Self-Referencing)
        public virtual Comment? ParentComment { get; private set; }
        public virtual ICollection<Comment> Replies { get; private set; } = new List<Comment>();

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        /// <summary>
        /// Constructor mặc định cho Entity Framework Core
        /// </summary>
        protected Comment() { }

        /// <summary>
        /// Constructor tạo bình luận mới (Có thể là bình luận gốc hoặc Reply tùy vào parentCommentId)
        /// </summary>
        public Comment(Guid postId, Guid userId, string content, Guid? parentCommentId = null)
        {
            if (postId == Guid.Empty)
                throw new ArgumentException("PostId không được để trống", nameof(postId));

            if (userId == Guid.Empty)
                throw new ArgumentException("UserId không được để trống", nameof(userId));

            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Nội dung bình luận không được để trống", nameof(content));

            PostId = postId;
            UserId = userId;
            Content = content;
            ParentCommentId = parentCommentId;

            // Ghi nhận người tạo thông qua class cha AuditableEntity
            SetCreatedBy(userId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Nghiệp vụ: Chỉnh sửa nội dung bình luận
        /// </summary>
        public void UpdateContent(string newContent, Guid updaterId)
        {
            if (string.IsNullOrWhiteSpace(newContent))
                throw new ArgumentException("Nội dung bình luận không được để trống", nameof(newContent));

            Content = newContent;

            // Ghi nhận thời gian và ID người vừa chỉnh sửa
            SetUpdated(updaterId);
        }
    }
}