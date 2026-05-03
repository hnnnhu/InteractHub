using SocialGraphPlatform.Domain.Entities.Base;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Thông báo (Notification).
    /// Ghi nhận các sự kiện cần báo cho người dùng biết (Like, Comment, Kết bạn...).
    /// </summary>
    public class Notification : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        /// <summary>Khóa ngoại: Người NHẬN thông báo (Ai là người sẽ thấy cái chuông sáng lên)</summary>
        public Guid ReceiverId { get; private set; }

        /// <summary>Khóa ngoại: Người KÍCH HOẠT thông báo (VD: Người vừa bấm Like). Có thể null nếu là thông báo hệ thống.</summary>
        public Guid? TriggeredById { get; private set; }

        /// <summary>Loại thông báo (Để UI biết nên hiển thị Icon gì: Trái tim, Comment, hay Icon kết bạn)</summary>
        public NotificationType Type { get; private set; }

        /// <summary>Nội dung chi tiết của thông báo (VD: "Nguyễn Văn A đã thích bài viết của bạn")</summary>
        public string Content { get; private set; } = string.Empty;

        /// <summary>Trạng thái: Người dùng đã bấm vào xem thông báo này chưa?</summary>
        public bool IsRead { get; private set; }

        /// <summary>
        /// Đường dẫn (URL/Route) khi người dùng click vào thông báo.
        /// (VD: /post/123-abc để nhảy thẳng tới bài viết vừa được Like)
        /// </summary>
        public string? TargetUrl { get; private set; }

        /// <summary>
        /// ID của thực thể liên quan (PostId, CommentId, FriendshipId).
        /// Hữu ích cho việc query/thống kê ngầm phía Backend mà không phụ thuộc vào TargetUrl.
        /// </summary>
        public Guid? RelatedEntityId { get; private set; }

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual User Receiver { get; private set; } = null!;
        public virtual User? TriggeredBy { get; private set; }

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        protected Notification() { }

        /// <summary>
        /// Constructor tạo thông báo mới
        /// </summary>
        public Notification(Guid receiverId, Guid? triggeredById, NotificationType type,
    string content, string? targetUrl = null, Guid? relatedEntityId = null)
        {
            if (receiverId == Guid.Empty)
                throw new ArgumentException("ReceiverId không được để trống", nameof(receiverId));

            if (triggeredById.HasValue && receiverId == triggeredById.Value)
                throw new InvalidOperationException("Không thể tự gửi thông báo cho chính mình.");

            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Nội dung không được để trống", nameof(content));

            ReceiverId = receiverId;
            TriggeredById = triggeredById;
            Type = type;
            Content = content;
            TargetUrl = targetUrl;
            RelatedEntityId = relatedEntityId;
            IsRead = false;
            SetCreatedBy(triggeredById ?? Guid.Empty);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Đánh dấu là đã đọc
        /// </summary>
        public void MarkAsRead(Guid updaterId)
        {
            if (IsRead) return; // Nếu đọc rồi thì thôi

            IsRead = true;
            SetUpdated(updaterId);
        }

        /// <summary>
        /// Đánh dấu là chưa đọc
        /// </summary>
        public void MarkAsUnread(Guid updaterId)
        {
            if (!IsRead) return;

            IsRead = false;
            SetUpdated(updaterId);
        }
    }
}