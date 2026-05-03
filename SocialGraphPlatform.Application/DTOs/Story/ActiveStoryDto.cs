namespace SocialGraphPlatform.Application.DTOs.Story;

public class ActiveStoryDto
{
    // ── THÔNG TIN CHỦ STORY ───────────────────────────────────────────────
    public Guid UserId { get; set; }

    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    // ── DANH SÁCH STORY ───────────────────────────────────────────────────
    /// <summary>
    /// Danh sách tất cả Story đang active của người dùng này.
    /// Sắp xếp theo thời gian tạo tăng dần (Story cũ nhất ở đầu).
    /// </summary>
    public List<StoryResponseDto> Stories { get; set; } = new();

    // ── THỐNG KÊ ──────────────────────────────────────────────────────────
    public int StoryCount => Stories.Count;

    /// <summary>
    /// Số Story chưa được người xem hiện tại xem.
    /// Dùng để quyết định hiển thị vòng tròn Story có viền màu hay viền xám.
    /// </summary>
    public int UnviewedCount { get; set; }

    /// <summary>
    /// Kiểm tra xem người dùng hiện tại đã xem hết tất cả Story của người này chưa.
    /// True = viền xám (đã xem hết), False = viền màu (còn chưa xem).
    /// </summary>
    public bool IsAllViewed => UnviewedCount == 0 && StoryCount > 0;

    // ── THÔNG TIN THỜI GIAN ───────────────────────────────────────────────
    /// <summary>
    /// Thời điểm Story mới nhất được đăng.
    /// Dùng để sắp xếp thứ tự các nhóm Story trên Story Tray (mới nhất lên trên).
    /// </summary>
    public DateTimeOffset LatestStoryCreatedAt { get; set; }
}