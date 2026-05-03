using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Reaction;

namespace SocialGraphPlatform.Application.Validators.Post;

public class AddReactionValidator : AbstractValidator<AddReactionDto>
{
    public AddReactionValidator()
    {
        RuleFor(x => x.PostId)
            .NotEmpty().WithMessage("ID bài viết là bắt buộc");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Loại cảm xúc không hợp lệ");
    }
}