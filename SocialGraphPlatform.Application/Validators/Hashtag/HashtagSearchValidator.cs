using FluentValidation;
using SocialGraphPlatform.Application.DTOs.Hashtag;

namespace SocialGraphPlatform.Application.Validators.Hashtag;

public class HashtagSearchValidator : AbstractValidator<HashtagSearchDto>
{
    public HashtagSearchValidator()
    {
        // Keyword
        RuleFor(x => x.Keyword)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự")
            .When(x => !string.IsNullOrWhiteSpace(x.Keyword));

        // Phân trang
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang phải lớn hơn hoặc bằng 1");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("Kích thước trang phải lớn hơn hoặc bằng 1")
            .LessThanOrEqualTo(100).WithMessage("Kích thước trang không được vượt quá 100 để đảm bảo hiệu năng");

        // SortBy - Ngăn chặn SQL Injection hoặc lỗi truy vấn do SortBy không hợp lệ
        RuleFor(x => x.SortBy)
            .Must(ValidSortFields)
            .WithMessage("Trường sắp xếp không hợp lệ. Chỉ hỗ trợ: UsageCount, Name, CreatedAt")
            .When(x => !string.IsNullOrWhiteSpace(x.SortBy));
    }

    private bool ValidSortFields(string? sortBy)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
            return true;

        var validFields = new[] { "UsageCount", "Name", "CreatedAt" };
        return validFields.Contains(sortBy);
    }
}