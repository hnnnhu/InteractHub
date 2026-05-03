using SocialGraphPlatform.Domain.Entities.Base;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Tin 24h (Story).
    /// Áp dụng chặt chẽ Rich Domain Model và kiểm soát trọn vẹn vòng đời.
    /// </summary>
    public class Story : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        public Guid UserId { get; private set; }

        /// <summary>Cho phép null để hỗ trợ Story dạng Text-only (Chỉ có chữ, không có ảnh/video)</summary>
        public string? MediaUrl { get; private set; }

        public MediaType Type { get; private set; }
        public string? Content { get; private set; }
        public DateTime ExpiresAt { get; private set; }
        public PrivacyLevel Privacy { get; private set; }

        // --- 2. LIÊN KẾT BẢNG & BACKING FIELDS ---

        public virtual User User { get; private set; } = null!;

        // Backing Field bảo vệ danh sách lượt xem
        private readonly List<StoryView> _views = new();
        public virtual IReadOnlyCollection<StoryView> Views => _views.AsReadOnly();

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        protected Story() { }

        public Story(Guid userId, string? mediaUrl, MediaType type, string? content = null, PrivacyLevel privacy = PrivacyLevel.Public, int durationHours = 24)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("UserId không được để trống", nameof(userId));

            // Rule: Story bắt buộc phải có ảnh/video HOẶC có chữ. Không được rỗng cả hai.
            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrWhiteSpace(mediaUrl))
                throw new ArgumentException("Story phải có content hoặc media");

            if (durationHours <= 0)
                throw new ArgumentException("Thời gian tồn tại của Story phải lớn hơn 0 giờ");

            UserId = userId;
            MediaUrl = mediaUrl;
            Type = type;
            Content = content;
            Privacy = privacy;

            ExpiresAt = DateTime.UtcNow.AddHours(durationHours);
            SetCreatedBy(userId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Kiểm tra xem Story còn khả dụng để xem/tương tác không
        /// </summary>
        public bool IsActive()
        {
            return !IsDeleted && DateTime.UtcNow < ExpiresAt;
        }

        /// <summary>
        /// Ghi nhận lượt xem Story mới và trả về object StoryView
        /// </summary>
        public StoryView AddView(Guid viewerId)
        {
            if (viewerId == Guid.Empty)
                throw new ArgumentException("ViewerId không hợp lệ");

            if (!IsActive())
                throw new InvalidOperationException("Story không còn hoạt động");

            if (viewerId == UserId)
                throw new InvalidOperationException("Không tính view của chính chủ");

            // Rule: 1 user chỉ view 1 lần, nếu đã xem rồi thì trả về object cũ
            var existing = _views.Find(v => v.ViewerId == viewerId);
            if (existing != null)
                return existing;

            var view = new StoryView(this.Id, viewerId);
            _views.Add(view);

            return view;
        }

        /// <summary>
        /// Cập nhật nội dung hoặc media của Story
        /// </summary>
        public void UpdateContent(string? content, string? mediaUrl, Guid updatedBy)
        {
            // Kiểm tra tính hợp lệ giống hệt constructor
            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrWhiteSpace(mediaUrl))
                throw new ArgumentException("Story phải có content hoặc media");

            Content = content;
            MediaUrl = mediaUrl;

            SetUpdated(updatedBy);
        }

        /// <summary>
        /// Cập nhật trạng thái quyền riêng tư
        /// </summary>
        public void UpdatePrivacy(PrivacyLevel privacy, Guid updatedBy)
        {
            Privacy = privacy;
            SetUpdated(updatedBy);
        }

        /// <summary>
        /// Xóa story (Soft delete)
        /// </summary>
        public void Delete(Guid userId)
        {
            if (userId != UserId)
                throw new InvalidOperationException("Bạn không có quyền xóa Story này");

            SoftDelete(userId);
        }
    }
}