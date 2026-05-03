using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Common;

namespace SocialGraphPlatform.Application.Validators.Common;

public class PaginationValidator : AbstractValidator<PagedResult<object>> // Sử dụng object để validate generic
{
    public PaginationValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang phải lớn hơn hoặc bằng 1");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("Kích thước trang phải lớn hơn hoặc bằng 1")
            .LessThanOrEqualTo(100).WithMessage("Kích thước trang không được vượt quá 100 để đảm bảo hiệu năng");

        // Kiểm tra TotalCount hợp lý
        RuleFor(x => x.TotalCount)
            .GreaterThanOrEqualTo(0).WithMessage("Tổng số bản ghi không được âm");

        // Kiểm tra logic TotalPages
        RuleFor(x => x)
            .Must(x => x.TotalPages >= 0)
            .WithMessage("Tổng số trang không được âm");
    }
}