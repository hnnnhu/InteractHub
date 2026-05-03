using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Notification;

public class NotificationResponseDto
{
    // ── ĐỊNH DANH ─────────────────────────────────────────────────────────
    public Guid Id { get; set; }

    // ── THÔNG TIN NGƯỜI KÍCH HOẠT ────────────────────────────────────────
    public Guid? TriggeredById { get; set; }
    public string? TriggeredByUserName { get; set; }
    public string? TriggeredByFullName { get; set; }
    public string? TriggeredByAvatarUrl { get; set; }

    // ── NỘI DUNG THÔNG BÁO ────────────────────────────────────────────────
    public NotificationType Type { get; set; }

    /// <summary>Tên hiển thị của loại thông báo (dùng cho UI).</summary>
    public string TypeLabel => Type switch
    {
        NotificationType.System => "Thông báo hệ thống",
        NotificationType.FriendRequest => "Lời mời kết bạn",
        NotificationType.FriendAccepted => "Đã chấp nhận kết bạn",
        NotificationType.PostReaction => "Cảm xúc bài viết",
        NotificationType.PostComment => "Bình luận bài viết",
        NotificationType.StoryReaction => "Cảm xúc Story",
        NotificationType.Mention => "Nhắc đến bạn",
        _ => "Thông báo"
    };

    /// <summary>Icon emoji đại diện cho loại thông báo.</summary>
    public string TypeIcon => Type switch
    {
        NotificationType.System => "🔔",
        NotificationType.FriendRequest => "👤",
        NotificationType.FriendAccepted => "🤝",
        NotificationType.PostReaction => "❤️",
        NotificationType.PostComment => "💬",
        NotificationType.StoryReaction => "✨",
        NotificationType.Mention => "@",
        _ => "🔔"
    };

    public string Content { get; set; } = string.Empty;

    // ── ĐIỀU HƯỚNG & LIÊN KẾT ─────────────────────────────────────────────
    public string? TargetUrl { get; set; }
    public Guid? RelatedEntityId { get; set; }

    // ── TRẠNG THÁI ────────────────────────────────────────────────────────
    public bool IsRead { get; set; }

    // ── THỜI GIAN ─────────────────────────────────────────────────────────
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }

    /// <summary>Thời gian tương đối (ví dụ: "2 phút trước", "1 giờ trước").</summary>
    public string TimeAgo { get; set; } = string.Empty;

    // ── GỘP NHÓM (TÙY CHỌN) ──────────────────────────────────────────────
    /// <summary>Số lượng người đã thực hiện hành động cùng loại (nếu được gộp).</summary>
    public int GroupedCount { get; set; } = 1;
}