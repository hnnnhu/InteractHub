using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Notification;

namespace SocialGraphPlatform.Application.Validators.Notification;

public class NotificationSettingsValidator : AbstractValidator<NotificationSettingsDto>
{
    public NotificationSettingsValidator()
    {
        // Quiet Hours validation
        RuleFor(x => x.QuietHoursEnabled)
            .NotNull();

        RuleFor(x => x.QuietHoursStart)
            .InclusiveBetween(0, 23).WithMessage("Giờ bắt đầu không làm phiền phải từ 0 đến 23")
            .When(x => x.QuietHoursEnabled);

        RuleFor(x => x.QuietHoursEnd)
            .InclusiveBetween(0, 23).WithMessage("Giờ kết thúc không làm phiền phải từ 0 đến 23")
            .When(x => x.QuietHoursEnabled);

        // Logic: QuietHoursEnd nên lớn hơn QuietHoursStart nếu cùng ngày
        // (hoặc xử lý qua đêm - tùy logic bạn muốn)
        RuleFor(x => x)
            .Must(x => !x.QuietHoursEnabled || x.QuietHoursEnd > x.QuietHoursStart || x.QuietHoursEnd < x.QuietHoursStart)
            .When(x => x.QuietHoursEnabled)
            .WithMessage("Giờ kết thúc không làm phiền phải khác giờ bắt đầu");

        // Các trường boolean không cần validate nhiều
        RuleFor(x => x.EnableAllNotifications).NotNull();
        RuleFor(x => x.PushEnabled).NotNull();
        RuleFor(x => x.EnableEmailNotification).NotNull();
    }
}