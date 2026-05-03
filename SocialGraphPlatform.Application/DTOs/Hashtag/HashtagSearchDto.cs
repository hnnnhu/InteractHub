namespace SocialGraphPlatform.Application.DTOs.Hashtag;

public class HashtagSearchDto
{
    /// <summary>Từ khóa tìm kiếm (ví dụ: "vietnam", "food")</summary>
    public string? Keyword { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;

    /// <summary>Sắp xếp theo: UsageCount (trending), Name (alphabet), CreatedAt</summary>
    public string SortBy { get; set; } = "UsageCount";

    public bool SortDescending { get; set; } = true;
}