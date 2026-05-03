using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Post;

namespace SocialGraphPlatform.Application.Validators.Post;

public class CreatePostValidator : AbstractValidator<CreatePostDto>
{
    public CreatePostValidator()
    {
        // 1. Nội dung văn bản
        RuleFor(x => x.Content)
            .MaximumLength(10000).WithMessage("Nội dung bài viết không được vượt quá 10.000 ký tự");

        // 2. Quyền riêng tư
        RuleFor(x => x.Privacy)
            .IsInEnum().WithMessage("Quyền riêng tư không hợp lệ");

        // 3. MediaUrls
        RuleForEach(x => x.MediaUrls)
            .NotEmpty().WithMessage("Đường dẫn media không được để trống")
            .MaximumLength(500).WithMessage("Đường dẫn media không được vượt quá 500 ký tự");

        // 4. Hashtags
        RuleForEach(x => x.Hashtags)
            .MaximumLength(50).WithMessage("Một hashtag không được vượt quá 50 ký tự")
            .Matches(@"^[a-zA-Z0-9_]+$").WithMessage("Hashtag chỉ được chứa chữ cái, số và dấu gạch dưới (không bao gồm dấu #)");

        // 5. Business Rule: Phải có nội dung HOẶC có media
        RuleFor(x => x)
            .Must(HaveContentOrMedia)
            .WithMessage("Bài viết không được để trống hoàn toàn. Vui lòng nhập nội dung hoặc tải lên ít nhất một hình ảnh/video.");
    }

    // Hàm hỗ trợ kiểm tra logic kinh doanh
    private bool HaveContentOrMedia(CreatePostDto dto)
    {
        bool hasContent = !string.IsNullOrWhiteSpace(dto.Content);
        bool hasMedia = dto.MediaUrls != null && dto.MediaUrls.Count > 0;

        return hasContent || hasMedia;
    }
}