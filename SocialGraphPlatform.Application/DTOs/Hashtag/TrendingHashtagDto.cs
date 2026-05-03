namespace SocialGraphPlatform.Application.DTOs.Hashtag;

public class TrendingHashtagDto
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Số lượng bài viết sử dụng hashtag trong khoảng thời gian gần đây</summary>
    public int UsageCount { get; set; }

    /// <summary>Vị trí xếp hạng trending (1 = trending nhất)</summary>
    public int Rank { get; set; }

    /// <summary>Tăng/giảm so với kỳ trước (tùy chọn)</summary>
    public int? ChangePercent { get; set; }
}