using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Story;

namespace SocialGraphPlatform.Application.Validators.Story;

public class CreateStoryValidator : AbstractValidator<CreateStoryDto>
{
    public CreateStoryValidator()
    {
        RuleFor(x => x.MediaUrl)
            .NotEmpty().WithMessage("MediaUrl là bắt buộc khi tạo Story")
            .MaximumLength(500).WithMessage("Đường dẫn media không được vượt quá 500 ký tự");

        RuleFor(x => x.Content)
            .MaximumLength(500).WithMessage("Nội dung Story không được vượt quá 500 ký tự");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Loại media không hợp lệ");

        RuleFor(x => x.Privacy)
            .IsInEnum().WithMessage("Quyền riêng tư không hợp lệ");

        RuleFor(x => x.DurationHours)
            .InclusiveBetween(1, 168).WithMessage("Thời gian tồn tại của Story phải từ 1 đến 168 giờ");

        // Business Rule: Phải có ít nhất Content HOẶC MediaUrl
        RuleFor(x => x)
            .Must(HaveContentOrMedia)
            .WithMessage("Story phải có nội dung văn bản hoặc ít nhất một media (ảnh/video)");
    }

    private bool HaveContentOrMedia(CreateStoryDto dto)
    {
        bool hasContent = !string.IsNullOrWhiteSpace(dto.Content);
        bool hasMedia = !string.IsNullOrWhiteSpace(dto.MediaUrl);

        return hasContent || hasMedia;
    }
}