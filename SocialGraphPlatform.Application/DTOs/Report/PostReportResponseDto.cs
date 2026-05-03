using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Report;

public class PostReportResponseDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid ReporterId { get; set; }

    // Thông tin người báo cáo
    public string ReporterUserName { get; set; } = string.Empty;
    public string ReporterFullName { get; set; } = string.Empty;
    public string? ReporterAvatarUrl { get; set; }

    // Thông tin bài viết bị báo cáo
    public string PostContent { get; set; } = string.Empty;
    public string? PostMediaUrl { get; set; }
    public string PostAuthorUserName { get; set; } = string.Empty;

    // Nội dung báo cáo
    public ReportReason Reason { get; set; }
    public string ReasonLabel => Reason.ToString();
    public string? Details { get; set; }

    // Trạng thái xử lý
    public ReportStatus Status { get; set; }
    public string StatusLabel => Status.ToString();

    // Thời gian
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    // Người xử lý (Admin/Moderator)
    public Guid? ProcessedById { get; set; }
    public string? ProcessedByUserName { get; set; }
}