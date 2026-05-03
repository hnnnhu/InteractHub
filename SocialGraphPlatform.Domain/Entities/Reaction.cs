using SocialGraphPlatform.Domain.Entities.Base;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Cảm xúc (Reaction).
    /// Ghi nhận hành vi thả biểu cảm (Like, Heart, Haha...) của người dùng lên bài viết.
    /// Kế thừa AuditableEntity để truy vết ai thả, lúc nào và khi nào thì đổi cảm xúc.
    /// </summary>
    public class Reaction : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        /// <summary>Khóa ngoại trỏ tới bài viết được thả cảm xúc</summary>
        public Guid PostId { get; private set; }

        /// <summary>Khóa ngoại trỏ tới người dùng đã thả cảm xúc</summary>
        public Guid UserId { get; private set; }

        /// <summary>Loại cảm xúc (Like, Love, Haha, Wow, Sad, Angry)</summary>
        public ReactionType Type { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual Post Post { get; private set; } = null!;
        public virtual User User { get; private set; } = null!;

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        /// <summary>
        /// Constructor mặc định cho Entity Framework Core
        /// </summary>
        protected Reaction() { }

        /// <summary>
        /// Constructor tạo mới một lượt thả cảm xúc
        /// </summary>
        public Reaction(Guid postId, Guid userId, ReactionType type)
        {
            if (postId == Guid.Empty)
                throw new ArgumentException("PostId không được để trống", nameof(postId));

            if (userId == Guid.Empty)
                throw new ArgumentException("UserId không được để trống", nameof(userId));

            PostId = postId;
            UserId = userId;
            Type = type;

            // Ghi nhận người tạo thông qua class cha AuditableEntity
            SetCreatedBy(userId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Nghiệp vụ: Thay đổi loại cảm xúc 
        /// (Ví dụ: Đang từ Like chuyển sang Love)
        /// </summary>
        public void ChangeReactionType(ReactionType newType, Guid updaterId)
        {
            if (Type == newType)
                return; // Nếu bấm trùng cảm xúc cũ thì không làm gì cả (Hoặc tầng Service sẽ gọi hàm SoftDelete để gỡ cảm xúc)

            Type = newType;

            // Ghi nhận thời gian và người vừa thay đổi cảm xúc
            SetUpdated(updaterId);
        }
    }
}