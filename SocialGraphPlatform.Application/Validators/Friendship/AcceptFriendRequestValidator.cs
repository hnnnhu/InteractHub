using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Friendship;

namespace SocialGraphPlatform.Application.Validators.Friendship;

public class AcceptFriendRequestValidator : AbstractValidator<FriendRequestResponseDto>
{
    public AcceptFriendRequestValidator()
    {
        RuleFor(x => x.FriendshipId)
            .NotEmpty().WithMessage("Mã lời mời kết bạn không được để trống.");
    }
}