// SocialGraphPlatform.Application/Interfaces/IReportService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Report;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IReportService
{
    // =================================================
    // 1. NGƯỜI DÙNG (USER ACTIONS)
    // =================================================

    /// <summary>
    /// Gửi báo cáo vi phạm cho một bài viết
    /// </summary>
    Task<ApiResponse<IdDto>> CreatePostReportAsync(Guid reporterId, CreatePostReportDto request);

    /// <summary>
    /// Lấy danh sách các lý do báo cáo được hệ thống hỗ trợ
    /// </summary>
    Task<ApiResponse<List<ReportReasonDto>>> GetReportReasonsAsync();

    /// <summary>
    /// Lấy lịch sử báo cáo của chính người dùng hiện tại (phân trang)
    /// </summary>
    Task<ApiResponse<PagedResult<PostReportResponseDto>>> GetMyReportsAsync(Guid userId, int pageNumber, int pageSize);

    /// <summary>
    /// Người dùng xem chi tiết một báo cáo mà chính họ đã gửi
    /// </summary>
    Task<ApiResponse<PostReportResponseDto>> GetMyReportByIdAsync(Guid userId, Guid reportId);

    // =================================================
    // 2. QUẢN TRỊ VIÊN (ADMIN / MODERATOR ACTIONS)
    // =================================================

    /// <summary>
    /// Lấy toàn bộ danh sách báo cáo trên hệ thống (phân trang, hỗ trợ lọc)
    /// </summary>
    Task<ApiResponse<PagedResult<PostReportResponseDto>>> GetAllReportsAsync(
        int pageNumber,
        int pageSize,
        ReportStatus? status = null,
        ReportReason? reason = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null);

    /// <summary>
    /// Xem chi tiết một báo cáo cụ thể (Admin/Mod)
    /// </summary>
    Task<ApiResponse<PostReportResponseDto>> GetReportByIdAsync(Guid reportId);

    /// <summary>
    /// Xử lý và hoàn tất báo cáo (chuyển sang trạng thái Resolved)
    /// </summary>
    Task<ApiResponse> ResolveReportAsync(Guid adminId, Guid reportId, ResolveReportDto request);

    /// <summary>
    /// Đánh dấu báo cáo đang được xem xét (chuyển sang trạng thái Reviewed)
    /// </summary>
    Task<ApiResponse> MarkAsReviewedAsync(Guid adminId, Guid reportId);

    /// <summary>
    /// Bác bỏ báo cáo (chuyển sang trạng thái Dismissed)
    /// </summary>
    Task<ApiResponse> DismissReportAsync(Guid adminId, Guid reportId, ResolveReportDto request);
}