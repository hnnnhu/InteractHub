using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Auth;

namespace SocialGraphPlatform.Application.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.EmailOrUserName)
            .NotEmpty().WithMessage("Email hoặc tên đăng nhập là bắt buộc");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu là bắt buộc");
    }
}