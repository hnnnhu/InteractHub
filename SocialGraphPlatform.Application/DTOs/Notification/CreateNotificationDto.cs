using System.ComponentModel.DataAnnotations;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Notification;

public class CreateNotificationDto : IValidatableObject
{
    /// <summary>ID người nhận thông báo (bắt buộc).</summary>
    [Required(ErrorMessage = "Người nhận là bắt buộc")]
    public Guid ReceiverId { get; set; }

    /// <summary>ID người kích hoạt (có thể null nếu là hệ thống).</summary>
    public Guid? TriggeredById { get; set; }

    /// <summary>Loại thông báo.</summary>
    [Required]
    public NotificationType Type { get; set; }

    /// <summary>Nội dung thông báo (bắt buộc).</summary>
    [Required(ErrorMessage = "Nội dung thông báo không được để trống")]
    [MinLength(1)]
    public string Content { get; set; } = string.Empty;

    /// <summary>Đường dẫn điều hướng khi click (tùy chọn).</summary>
    public string? TargetUrl { get; set; }

    /// <summary>ID của thực thể liên quan (Post, Comment, Friendship...).</summary>
    public Guid? RelatedEntityId { get; set; }

    /// <summary>
    /// Nếu true, cho phép gửi ngay cả khi loại thông báo này bị tắt trong cài đặt.
    /// Dùng cho các thông báo bắt buộc (ví dụ: cảnh báo vi phạm).
    /// </summary>
    public bool BypassUserSettings { get; set; } = false;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // Kiểm tra không gửi thông báo cho chính mình
        if (TriggeredById.HasValue && TriggeredById.Value == ReceiverId)
        {
            yield return new ValidationResult(
                "Không thể tự gửi thông báo cho chính mình.",
                new[] { nameof(TriggeredById), nameof(ReceiverId) }
            );
        }

        // Với thông báo hệ thống, TriggeredById nên để null và BypassUserSettings thường là true
        if (Type == NotificationType.System && TriggeredById.HasValue)
        {
            yield return new ValidationResult(
                "Thông báo hệ thống phải có TriggeredById là null.",
                new[] { nameof(TriggeredById) }
            );
        }
    }
}