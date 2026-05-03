using FluentValidation;
using SocialGraphPlatform.Application.DTOs.User;

namespace SocialGraphPlatform.Application.Validators.User;

public class UpdateProfileValidator : AbstractValidator<UpdateProfileDto>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên là bắt buộc")
            .MaximumLength(100).WithMessage("Họ tên không được vượt quá 100 ký tự");

        // FluentValidation tự động bỏ qua (không báo lỗi) nếu giá trị là null, 
        // nên ta chỉ cần đặt MaximumLength là đủ an toàn.
        RuleFor(x => x.Bio)
            .MaximumLength(500).WithMessage("Tiểu sử không được vượt quá 500 ký tự");

        RuleFor(x => x.AvatarUrl)
            .MaximumLength(500).WithMessage("Đường dẫn ảnh đại diện không được vượt quá 500 ký tự");

        RuleFor(x => x.CoverPhotoUrl)
            .MaximumLength(500).WithMessage("Đường dẫn ảnh bìa không được vượt quá 500 ký tự");

        // Bổ sung thêm logic thực tế: Ngày sinh không được lớn hơn ngày hiện tại
        RuleFor(x => x.DateOfBirth)
            .LessThanOrEqualTo(DateTime.Today).WithMessage("Ngày sinh không hợp lệ (không thể ở trong tương lai)")
            .When(x => x.DateOfBirth.HasValue);
    }
}