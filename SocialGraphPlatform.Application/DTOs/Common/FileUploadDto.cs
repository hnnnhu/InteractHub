using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Common;

public class FileUploadDto
{
    [Required(ErrorMessage = "Vui lòng chọn file để tải lên")]
    public IFormFile File { get; set; } = null!;

    public string? Folder { get; set; } = "uploads";   // Thư mục lưu trữ (posts, stories, avatars...)
}