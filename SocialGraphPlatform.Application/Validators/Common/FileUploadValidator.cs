using FluentValidation;
using Microsoft.AspNetCore.Http;
using SocialGraphPlatform.Application.DTOs.Common;

namespace SocialGraphPlatform.Application.Validators.Common;

public class FileUploadValidator : AbstractValidator<FileUploadDto>
{
    private const long MaxFileSizeInBytes = 10 * 1024 * 1024; // 10MB

    public FileUploadValidator()
    {
        RuleFor(x => x.File)
            .NotNull().WithMessage("Vui lòng chọn file để tải lên")
            .Must(BeValidFile).WithMessage("File không hợp lệ hoặc không được hỗ trợ");

        RuleFor(x => x.Folder)
            .MaximumLength(50).WithMessage("Tên thư mục không được vượt quá 50 ký tự")
            .Matches(@"^[a-zA-Z0-9_\-\/]+$").WithMessage("Tên thư mục chỉ được chứa chữ cái, số, dấu gạch ngang, gạch dưới và dấu gạch chéo")
            .When(x => !string.IsNullOrWhiteSpace(x.Folder));
    }

    private bool BeValidFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return false;

        // Kiểm tra kích thước file
        if (file.Length > MaxFileSizeInBytes)
            return false;

        // Kiểm tra định dạng file được phép
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".avi" };
        var fileExtension = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();

        return allowedExtensions.Contains(fileExtension);
    }
}