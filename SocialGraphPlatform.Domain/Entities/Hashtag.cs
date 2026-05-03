// SocialGraphPlatform.Domain/Entities/Hashtag.cs
using System.Text.RegularExpressions;
using SocialGraphPlatform.Domain.Entities.Base;

namespace SocialGraphPlatform.Domain.Entities
{
    /// <summary>
    /// Thực thể Hashtag.
    /// Quản lý các từ khóa (#) được gắn trong bài viết để phục vụ tìm kiếm và trending.
    /// </summary>
    public class Hashtag : AuditableEntity
    {
        // --- 1. THUỘC TÍNH CỐT LÕI (DATA PROPERTIES) ---

        public string Name { get; private set; } = string.Empty;

        /// <summary>
        /// Số lần hashtag này được sử dụng. private set để bảo vệ tính toàn vẹn dữ liệu.
        /// </summary>
        public int UsageCount { get; private set; } = 0;

        // --- 2. LIÊN KẾT BẢNG (NAVIGATION PROPERTIES) ---

        public virtual ICollection<PostHashtag> PostHashtags { get; private set; } = new List<PostHashtag>();

        // --- 3. HÀM KHỞI TẠO (CONSTRUCTORS) ---

        protected Hashtag() { }

        public Hashtag(string name, Guid creatorId)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Tên hashtag không được để trống.");

            if (creatorId == Guid.Empty)
                throw new ArgumentException("ID người tạo không hợp lệ.");

            // 1. Chuẩn hóa trước khi validate
            var normalizedName = CleanAndNormalize(name);

            // 2. Kiểm tra độ dài (Tối đa 50 ký tự)
            if (normalizedName.Length > 50)
                throw new ArgumentException("Độ dài hashtag không được vượt quá 50 ký tự.");

            // 3. Kiểm tra ký tự hợp lệ (Chữ cái tiếng Việt, số, dấu gạch dưới)
            // ^[\p{L}\p{N}_]+$ : 
            // \p{L}: Mọi loại chữ cái (bao gồm có dấu tiếng Việt)
            // \p{N}: Mọi loại số
            // _: Dấu gạch dưới
            if (!Regex.IsMatch(normalizedName, @"^[\p{L}\p{N}_]+$"))
                throw new ArgumentException("Hashtag chỉ được chứa chữ cái, số và dấu gạch dưới, không có khoảng trắng hoặc ký tự đặc biệt.");

            Name = normalizedName;
            UsageCount = 1;

            SetCreatedBy(creatorId);
        }

        // --- 4. HÀNH VI / NGHIỆP VỤ (BEHAVIORS) ---

        /// <summary>
        /// Tăng số lượng sử dụng (Dùng khi tạo Post)
        /// </summary>
        public void IncrementUsage()
        {
            UsageCount++;
            SetUpdated(CreatedBy);
        }

        /// <summary>
        /// Giảm số lượng sử dụng (Dùng khi xóa Post)
        /// </summary>
        public void DecrementUsage()
        {
            if (UsageCount > 0)
            {
                UsageCount--;
                UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        // --- 5. HELPER METHODS ---

        /// <summary>
        /// Chuẩn hóa tên hashtag (loại bỏ dấu # ở đầu, chuyển về lowercase, trim khoảng trắng)
        /// </summary>
        private string CleanAndNormalize(string input)
        {
            var cleaned = input.Trim().ToLowerInvariant();

            // Sử dụng char overload cho StartsWith để tối ưu hiệu năng
            if (cleaned.StartsWith('#'))
                cleaned = cleaned.Substring(1);

            return cleaned;
        }
    }
}