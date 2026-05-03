using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Notification;

public class MarkAsReadDto : IValidatableObject
{
    /// <summary>
    /// Danh sách ID thông báo cần đánh dấu đã đọc.
    /// </summary>
    public List<Guid>? NotificationIds { get; set; }

    /// <summary>
    /// Nếu = true → Đánh dấu **tất cả** thông báo chưa đọc của user là đã đọc.
    /// Khi bật MarkAll, NotificationIds sẽ bị bỏ qua.
    /// </summary>
    public bool MarkAll { get; set; } = false;

    /// <summary>
    /// Validation tùy chỉnh: Phải có ít nhất một trong hai cách.
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!MarkAll && (NotificationIds == null || NotificationIds.Count == 0))
        {
            yield return new ValidationResult(
                "Phải cung cấp NotificationIds hoặc đặt MarkAll = true",
                new[] { nameof(NotificationIds), nameof(MarkAll) }
            );
        }

        if (MarkAll && NotificationIds != null && NotificationIds.Count > 0)
        {
            yield return new ValidationResult(
                "Khi MarkAll = true, không cần truyền NotificationIds",
                new[] { nameof(NotificationIds) }
            );
        }
    }
}