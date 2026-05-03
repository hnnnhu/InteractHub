using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.SavedPost;

public class UpdateCollectionDto
{
    [Required(ErrorMessage = "Tên bộ sưu tập mới là bắt buộc")]
    [MaxLength(100, ErrorMessage = "Tên bộ sưu tập không được vượt quá 100 ký tự")]
    public string NewName { get; set; } = string.Empty;
}