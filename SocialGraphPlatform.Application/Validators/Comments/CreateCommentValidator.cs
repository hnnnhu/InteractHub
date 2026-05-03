using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Comment;

namespace SocialGraphPlatform.Application.Validators.Comment;

public class CreateCommentValidator : AbstractValidator<CreateCommentDto>
{
    public CreateCommentValidator()
    {
        RuleFor(x => x.PostId)
            .NotEmpty().WithMessage("Bài viết không tồn tại");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Nội dung bình luận không được để trống")
            .MaximumLength(2000).WithMessage("Nội dung bình luận không được vượt quá 2000 ký tự");

        // Nếu có ParentCommentId thì phải kiểm tra nó hợp lệ (có thể thêm logic trong Service)
        RuleFor(x => x.ParentCommentId)
            .Must(parentId => !parentId.HasValue || parentId.Value != Guid.Empty)
            .When(x => x.ParentCommentId.HasValue)
            .WithMessage("ParentCommentId không hợp lệ");
    }
}