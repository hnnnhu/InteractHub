namespace SocialGraphPlatform.Application.DTOs.Stories
{
    /// <summary>
    /// DTO đại diện cho một lượt xem Story.
    /// Chỉ tác giả của Story mới được phép truy vấn danh sách này.
    /// </summary>
    public class StoryViewDto
    {
        /// <summary>ID của bản ghi lượt xem</summary>
        public Guid Id { get; set; }

        /// <summary>ID của Story được xem</summary>
        public Guid StoryId { get; set; }

        /// <summary>ID của người đã xem</summary>
        public Guid ViewerId { get; set; }

        /// <summary>Tên hiển thị của người đã xem</summary>
        public string ViewerDisplayName { get; set; } = string.Empty;

        /// <summary>URL ảnh đại diện của người đã xem</summary>
        public string? ViewerAvatarUrl { get; set; }

        /// <summary>
        /// Thời điểm xem Story.
        /// Ánh xạ từ CreatedAt của StoryView entity (theo thiết kế Immutable Entity).
        /// </summary>
        public DateTimeOffset ViewedAt { get; set; }
    }
}