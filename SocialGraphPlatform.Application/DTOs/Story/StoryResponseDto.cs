using SocialGraphPlatform.Application.DTOs.Stories;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Story;

public class StoryResponseDto
{
    // ── ĐỊNH DANH ─────────────────────────────────────────────────────────
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // ── THÔNG TIN TÁC GIẢ ────────────────────────────────────────────────
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    // ── NỘI DUNG STORY ────────────────────────────────────────────────────
    public string? Content { get; set; }
    public string? MediaUrl { get; set; }
    public MediaType Type { get; set; }

    // ── TRẠNG THÁI & QUYỀN RIÊNG TƯ ──────────────────────────────────────
    public PrivacyLevel Privacy { get; set; }
    public string PrivacyLabel => Privacy.ToString();

    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    // ── TRẠNG THÁI HOẠT ĐỘNG ─────────────────────────────────────────────
    public bool IsActive { get; set; }
    public bool IsExpired { get; set; }

    /// <summary>
    /// Số giây còn lại trước khi Story hết hạn.
    /// = 0 nếu Story đã hết hạn.
    /// </summary>
    public long SecondsRemaining { get; set; }

    // ── THỐNG KÊ ─────────────────────────────────────────────────────────
    /// <summary>
    /// Tổng số lượt xem.
    /// Chỉ trả về giá trị thực khi request từ chính tác giả Story.
    /// Với người xem khác, trường này có thể là null hoặc 0.
    /// </summary>
    public int? ViewCount { get; set; }

    // ── DANH SÁCH NGƯỜI XEM GẦN ĐÂY (tùy chọn) ───────────────────────────
    public List<StoryViewDto>? RecentViewers { get; set; }
}