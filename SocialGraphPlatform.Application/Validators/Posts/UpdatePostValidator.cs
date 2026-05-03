using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Post;

namespace SocialGraphPlatform.Application.Validators.Post;

public class UpdatePostValidator : AbstractValidator<UpdatePostDto>
{
    public UpdatePostValidator()
    {
        RuleFor(x => x.PostId)
            .NotEmpty().WithMessage("ID bài viết là bắt buộc");

        RuleFor(x => x.Content)
            .MaximumLength(10000).WithMessage("Nội dung bài viết không được vượt quá 10.000 ký tự");

        RuleFor(x => x.Privacy)
            .IsInEnum().WithMessage("Quyền riêng tư không hợp lệ");
    }
}