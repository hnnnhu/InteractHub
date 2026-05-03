using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Comments;

namespace SocialGraphPlatform.Application.Validators.Comment;

public class UpdateCommentValidator : AbstractValidator<UpdateCommentDto>
{
    public UpdateCommentValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Nội dung bình luận không được để trống")
            .MaximumLength(2000).WithMessage("Nội dung bình luận không được vượt quá 2000 ký tự");
    }
}