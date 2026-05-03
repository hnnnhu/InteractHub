using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.Validations;

public class MaxFileSizeAttribute : ValidationAttribute
{
    private readonly int _maxFileSize;

    public MaxFileSizeAttribute(int maxFileSize)
    {
        _maxFileSize = maxFileSize;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is IFormFile file)
        {
            if (file.Length > _maxFileSize)
            {
                return new ValidationResult(ErrorMessage ?? $"Dung lượng file vượt quá mức cho phép ({_maxFileSize / (1024 * 1024)}MB).");
            }
        }

        return ValidationResult.Success;
    }
}