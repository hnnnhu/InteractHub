using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Auth;

namespace SocialGraphPlatform.Application.Validators.Auth;

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequestDto>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token là bắt buộc");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới là bắt buộc")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
            .MaximumLength(100).WithMessage("Mật khẩu mới không được vượt quá 100 ký tự");

        RuleFor(x => x.ConfirmNewPassword)
            .NotEmpty().WithMessage("Vui lòng xác nhận mật khẩu mới")
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu không khớp");
    }
}