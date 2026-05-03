using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Auth;

namespace SocialGraphPlatform.Application.Validators.Auth;

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequestDto>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Access Token là bắt buộc");

        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh Token là bắt buộc");
    }
}