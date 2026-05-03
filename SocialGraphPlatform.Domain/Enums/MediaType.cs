namespace SocialGraphPlatform.Domain.Enums
{
    /// <summary>
    /// Phân loại định dạng của tập tin đa phương tiện.
    /// Được sử dụng chung cho cả PostMedia và Story.
    /// </summary>
    public enum MediaType
    {
        /// <summary>
        /// Không có tập tin đính kèm. 
        /// Dành cho các Post hoặc Story dạng Text-only (Chỉ có văn bản/phông nền màu).
        /// </summary>
        None = 0,

        /// <summary>
        /// Hình ảnh tĩnh (Ví dụ: .jpg, .png, .webp...)
        /// </summary>
        Image = 1,

        /// <summary>
        /// Video/Clip chuyển động (Ví dụ: .mp4, .mov...)
        /// </summary>
        Video = 2,

        /// <summary>
        /// Âm thanh / Podcast (Ví dụ: .mp3, .wav...)
        /// </summary>
        Audio = 3,

        /// <summary>
        /// Tài liệu đính kèm (Ví dụ: .pdf, .docx, .xlsx...)
        /// Thường không dùng cho Story mà dùng cho các Bài viết (Post) trong Group hoặc nội bộ.
        /// </summary>
        Document = 4
    }
}