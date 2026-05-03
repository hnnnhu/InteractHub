using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Block;

namespace SocialGraphPlatform.Application.Validators.Block;

public class BlockUserValidator : AbstractValidator<BlockUserDto>
{
    public BlockUserValidator()
    {
        RuleFor(x => x.BlockedId)
            .NotEmpty().WithMessage("Vui lòng chọn người dùng để chặn");

        // Không cho phép tự chặn chính mình (thường xử lý thêm ở Service, nhưng validator cũng có thể kiểm tra nếu có CurrentUserId)
    }
}