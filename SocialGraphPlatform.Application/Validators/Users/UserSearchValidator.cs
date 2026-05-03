using FluentValidation;
using SocialGraphPlatform.Application.DTOs.User;

namespace SocialGraphPlatform.Application.Validators.User;

public class UserSearchValidator : AbstractValidator<UserSearchDto>
{
    public UserSearchValidator()
    {
        RuleFor(x => x.Keyword)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự");

        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang phải lớn hơn hoặc bằng 1");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("Kích thước trang phải lớn hơn hoặc bằng 1")
            .LessThanOrEqualTo(100).WithMessage("Kích thước trang không được vượt quá 100 để đảm bảo hiệu suất");
    }
}