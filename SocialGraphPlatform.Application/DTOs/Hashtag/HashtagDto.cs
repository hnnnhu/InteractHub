namespace SocialGraphPlatform.Application.DTOs.Hashtag;

public class HashtagDto
{
    public Guid Id { get; set; }

    /// <summary>Tên hashtag đã chuẩn hóa (không có dấu #)</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Số lượng bài viết đang sử dụng hashtag này</summary>
    public int UsageCount { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}