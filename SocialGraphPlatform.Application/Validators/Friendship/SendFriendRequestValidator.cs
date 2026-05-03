using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Friendship;

namespace SocialGraphPlatform.Application.Validators.Friendship;

public class SendFriendRequestValidator : AbstractValidator<SendFriendRequestDto>
{
    public SendFriendRequestValidator()
    {
        RuleFor(x => x.AddresseeId)
            .NotEmpty().WithMessage("Mã người nhận lời mời là bắt buộc");

        // Tùy chọn: Có thể thêm validation cho Message nếu bạn mở rộng DTO sau này
        // RuleFor(x => x.Message)
        //     .MaximumLength(200).WithMessage("Lời nhắn không được vượt quá 200 ký tự");
    }
}