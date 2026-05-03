using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.SavedPost;

public class CreateCollectionDto
{
    [Required(ErrorMessage = "Tên bộ sưu tập là bắt buộc")]
    [MaxLength(100, ErrorMessage = "Tên bộ sưu tập không được vượt quá 100 ký tự")]
    public string Name { get; set; } = string.Empty;
}