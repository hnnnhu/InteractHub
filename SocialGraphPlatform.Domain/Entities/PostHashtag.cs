namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Bảng trung gian (Junction Entity) kết nối giữa Bài viết (Post) và Hashtag.
    /// Thể hiện mối quan hệ nhiều-nhiều (N-N).
    /// </summary>
    public class PostHashtag
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (Khóa ngoại cấu thành Khóa chính) ---

        /// <summary>ID của bài viết</summary>
        public Guid PostId { get; private set; }

        /// <summary>ID của Hashtag</summary>
        public Guid HashtagId { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual Post Post { get; private set; } = null!;
        public virtual Hashtag Hashtag { get; private set; } = null!;

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        /// <summary>
        /// Constructor mặc định bắt buộc dành cho Entity Framework Core
        /// </summary>
        protected PostHashtag() { }

        /// <summary>
        /// Nghiệp vụ: Gắn một Hashtag vào một Bài viết
        /// </summary>
        public PostHashtag(Guid postId, Guid hashtagId)
        {
            if (postId == Guid.Empty)
                throw new ArgumentException("PostId không hợp lệ", nameof(postId));

            if (hashtagId == Guid.Empty)
                throw new ArgumentException("HashtagId không hợp lệ", nameof(hashtagId));

            PostId = postId;
            HashtagId = hashtagId;
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ ---

        // Bảng trung gian thuần túy thường không chứa logic nghiệp vụ phức tạp.
        // Việc thêm/xóa hashtag sẽ được thực hiện thông qua List<PostHashtag> ở bên trong entity Post.
    }
}