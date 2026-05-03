using FluentValidation;
using SocialGraphPlatform.Application.DTOs.SavedPost;

namespace SocialGraphPlatform.Application.Validators.SavedPost;

public class CreateCollectionValidator : AbstractValidator<CreateCollectionDto>
{
    public CreateCollectionValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên bộ sưu tập là bắt buộc")
            .MaximumLength(100).WithMessage("Tên bộ sưu tập không được vượt quá 100 ký tự")
            .Matches(@"^[\p{L}\p{N}\s_\-]+$").WithMessage("Tên bộ sưu tập chỉ được chứa chữ cái, số, khoảng trắng, dấu gạch ngang và gạch dưới");
    }
}