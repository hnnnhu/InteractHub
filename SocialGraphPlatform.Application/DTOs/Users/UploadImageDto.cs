using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
// Nếu bạn để các attribute ở thư mục khác thì using vào đây
using SocialGraphPlatform.Application.Validations; 

namespace SocialGraphPlatform.Application.DTOs.User;

public record UploadImageDto
{
    [Required(ErrorMessage = "Vui lòng chọn một tệp ảnh.")]
    [MaxFileSize(5 * 1024 * 1024, ErrorMessage = "Dung lượng ảnh không được vượt quá 5MB.")]
    [AllowedExtensions(new string[] { ".jpg", ".jpeg", ".png", ".webp" }, ErrorMessage = "Chỉ chấp nhận các định dạng: .jpg, .jpeg, .png, .webp")]
    public IFormFile File { get; init; } = null!;
}