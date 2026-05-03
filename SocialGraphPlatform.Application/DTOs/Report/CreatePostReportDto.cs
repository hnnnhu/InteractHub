using System.ComponentModel.DataAnnotations;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Report;

public class CreatePostReportDto
{
    [Required(ErrorMessage = "Bài viết cần báo cáo không tồn tại")]
    public Guid PostId { get; set; }

    [Required(ErrorMessage = "Lý do báo cáo là bắt buộc")]
    public ReportReason Reason { get; set; }

    [MaxLength(1000, ErrorMessage = "Chi tiết báo cáo không được vượt quá 1000 ký tự")]
    public string? Details { get; set; }
}