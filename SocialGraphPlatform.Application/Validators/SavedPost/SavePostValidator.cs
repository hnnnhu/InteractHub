using FluentValidation;
using SocialGraphPlatform.Application.DTOs.SavedPost;

namespace SocialGraphPlatform.Application.Validators.SavedPost;

public class SavePostValidator : AbstractValidator<SavePostDto>
{
    public SavePostValidator()
    {
        RuleFor(x => x.PostId)
            .NotEmpty().WithMessage("Mã bài viết là bắt buộc");

        RuleFor(x => x.CollectionName)
            .NotEmpty().WithMessage("Tên bộ sưu tập không được để trống")
            .MaximumLength(100).WithMessage("Tên bộ sưu tập không được vượt quá 100 ký tự")
            .When(x => !string.IsNullOrWhiteSpace(x.CollectionName));
    }
}