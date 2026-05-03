using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Report;

namespace SocialGraphPlatform.Application.Validators.Report;

public class CreatePostReportValidator : AbstractValidator<CreatePostReportDto>
{
    public CreatePostReportValidator()
    {
        RuleFor(x => x.PostId)
            .NotEmpty().WithMessage("Bài viết cần báo cáo không tồn tại");

        RuleFor(x => x.Reason)
            .IsInEnum().WithMessage("Lý do báo cáo không hợp lệ");

        RuleFor(x => x.Details)
            .MaximumLength(1000).WithMessage("Chi tiết báo cáo không được vượt quá 1000 ký tự")
            .When(x => !string.IsNullOrWhiteSpace(x.Details));
    }
}