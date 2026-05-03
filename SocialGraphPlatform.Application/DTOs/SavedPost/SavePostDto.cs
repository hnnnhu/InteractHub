using System;
using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.SavedPost;

public class SavePostDto
{
    [Required(ErrorMessage = "Mã bài viết là bắt buộc")]
    public Guid PostId { get; set; }

    [MaxLength(100, ErrorMessage = "Tên bộ sưu tập không được vượt quá 100 ký tự")]
    public string? CollectionName { get; set; } = "Mặc định";
}