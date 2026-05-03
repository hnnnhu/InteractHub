using FluentValidation;
using SocialGraphPlatform.Application.DTOs.User;

namespace SocialGraphPlatform.Application.Validators.User;

public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Mật khẩu hiện tại là bắt buộc");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới là bắt buộc")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
            .MaximumLength(100).WithMessage("Mật khẩu mới không được vượt quá 100 ký tự")
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới không được trùng với mật khẩu cũ");

        RuleFor(x => x.ConfirmNewPassword)
            .NotEmpty().WithMessage("Vui lòng xác nhận mật khẩu mới")
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu không khớp");
    }
}