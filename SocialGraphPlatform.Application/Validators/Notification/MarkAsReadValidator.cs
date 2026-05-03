using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Notification;

namespace SocialGraphPlatform.Application.Validators.Notification;

public class MarkAsReadValidator : AbstractValidator<MarkAsReadDto>
{
    public MarkAsReadValidator()
    {
        RuleFor(x => x)
            .Must(HaveValidMarkMode)
            .WithMessage("Phải cung cấp NotificationIds hoặc đặt MarkAll = true");

        // Nếu không dùng MarkAll thì NotificationIds phải có ít nhất 1 phần tử
        RuleFor(x => x.NotificationIds)
            .NotNull().When(x => !x.MarkAll)
            .WithMessage("NotificationIds không được để null khi không dùng MarkAll");

        RuleFor(x => x.NotificationIds)
            .Must(ids => ids != null && ids.Count > 0)
            .When(x => !x.MarkAll)
            .WithMessage("Phải cung cấp ít nhất một NotificationId khi không dùng MarkAll");

        // Nếu dùng MarkAll thì không cần truyền NotificationIds (tùy chọn cảnh báo)
        RuleFor(x => x.NotificationIds)
            .Must(ids => ids == null || ids.Count == 0)
            .When(x => x.MarkAll)
            .WithMessage("Khi MarkAll = true, không cần truyền NotificationIds");
    }

    private bool HaveValidMarkMode(MarkAsReadDto dto)
    {
        if (dto.MarkAll)
            return true;

        return dto.NotificationIds != null && dto.NotificationIds.Count > 0;
    }
}