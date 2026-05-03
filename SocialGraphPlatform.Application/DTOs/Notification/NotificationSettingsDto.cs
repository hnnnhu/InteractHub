using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Notification;

public class NotificationSettingsDto : IValidatableObject
{
    // ── CÀI ĐẶT CHUNG ─────────────────────────────────────────────────────
    /// <summary>Bật/tắt toàn bộ thông báo (Master Switch).</summary>
    public bool EnableAllNotifications { get; set; } = true;

    // ── THÔNG BÁO THEO LOẠI ───────────────────────────────────────────────
    /// <summary>Nhận thông báo khi có lời mời kết bạn mới.</summary>
    public bool FriendRequest { get; set; } = true;

    /// <summary>Nhận thông báo khi ai đó chấp nhận lời mời kết bạn.</summary>
    public bool FriendAccepted { get; set; } = true;

    /// <summary>Nhận thông báo khi có người thả cảm xúc vào bài viết.</summary>
    public bool PostReaction { get; set; } = true;

    /// <summary>Nhận thông báo khi có người bình luận vào bài viết.</summary>
    public bool PostComment { get; set; } = true;

    /// <summary>Nhận thông báo khi có người thả cảm xúc vào Story.</summary>
    public bool StoryReaction { get; set; } = true;

    /// <summary>Nhận thông báo khi có người nhắc đến bạn (@mention).</summary>
    public bool Mention { get; set; } = true;

    // ── THÔNG BÁO ĐẨY (PUSH NOTIFICATION) ────────────────────────────────
    /// <summary>Bật/tắt toàn bộ push notification.</summary>
    public bool PushEnabled { get; set; } = true;

    /// <summary>Bật chế độ không làm phiền (Quiet Hours).</summary>
    public bool QuietHoursEnabled { get; set; } = false;

    /// <summary>Giờ bắt đầu không làm phiền (0-23, theo giờ địa phương).</summary>
    [Range(0, 23, ErrorMessage = "Giờ bắt đầu phải từ 0 đến 23")]
    public int QuietHoursStart { get; set; } = 22;

    /// <summary>Giờ kết thúc không làm phiền (0-23, theo giờ địa phương).</summary>
    [Range(0, 23, ErrorMessage = "Giờ kết thúc phải từ 0 đến 23")]
    public int QuietHoursEnd { get; set; } = 7;

    // ── THÔNG BÁO EMAIL (Tương lai) ───────────────────────────────────────
    public bool EnableEmailNotification { get; set; } = false;

    /// <summary>
    /// Validation toàn cục: nếu bật Master Switch thì ít nhất một loại phải được bật,
    /// nếu QuietHoursEnabled thì giờ bắt đầu và kết thúc phải khác nhau (có thể qua đêm).
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EnableAllNotifications)
        {
            // Nếu tất cả các loại thông báo đều tắt => không hợp lệ
            if (!FriendRequest && !FriendAccepted && !PostReaction && !PostComment && !StoryReaction && !Mention)
            {
                yield return new ValidationResult(
                    "Phải bật ít nhất một loại thông báo khi Master Switch đang bật.",
                    new[] { nameof(EnableAllNotifications) }
                );
            }
        }

        if (QuietHoursEnabled)
        {
            // Giờ yên lặng không cho phép start == end
            if (QuietHoursStart == QuietHoursEnd)
            {
                yield return new ValidationResult(
                    "Giờ bắt đầu và kết thúc không được giống nhau khi bật Không làm phiền.",
                    new[] { nameof(QuietHoursStart), nameof(QuietHoursEnd) }
                );
            }
        }
    }
}