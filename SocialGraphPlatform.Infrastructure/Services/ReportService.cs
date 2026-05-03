// SocialGraphPlatform.Infrastructure/Services/ReportService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.DTOs.Report;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _reportRepository;
    private readonly IPostRepository _postRepository;
    private readonly INotificationService _notificationService;

    public ReportService(
        IReportRepository reportRepository,
        IPostRepository postRepository,
        INotificationService notificationService)
    {
        _reportRepository = reportRepository;
        _postRepository = postRepository;
        _notificationService = notificationService;
    }

    // =================================================
    // 1. NGƯỜI DÙNG GỬI BÁO CÁO
    // =================================================

    public async Task<ApiResponse<IdDto>> CreatePostReportAsync(Guid reporterId, CreatePostReportDto request)
    {
        if (!await _postRepository.ExistsActiveAsync(request.PostId))
            return ApiResponse<IdDto>.NotFound("Bài viết không tồn tại hoặc đã bị xóa");

        if (await _reportRepository.HasReportedAsync(reporterId, request.PostId))
            return ApiResponse<IdDto>.Fail("Bạn đã báo cáo bài viết này rồi");

        var report = new PostReport(request.PostId, reporterId, request.Reason, request.Details);

        await _reportRepository.AddAsync(report);
        await _reportRepository.SaveChangesAsync();

        return ApiResponse<IdDto>.Ok(new IdDto(report.Id), "Báo cáo đã được gửi thành công");
    }

    // =================================================
    // 2. LẤY DANH SÁCH LÝ DO BÁO CÁO
    // =================================================

    public Task<ApiResponse<List<ReportReasonDto>>> GetReportReasonsAsync()
    {
        var reasons = Enum.GetValues<ReportReason>()
            .Select(r => new ReportReasonDto
            {
                Reason = r,
                Label = r.ToString(),
                Description = GetReasonDescription(r)
            })
            .ToList();

        return Task.FromResult(ApiResponse<List<ReportReasonDto>>.Ok(reasons));
    }

    // =================================================
    // 3. XEM LỊCH SỬ BÁO CÁO CỦA CHÍNH MÌNH
    // =================================================

    public async Task<ApiResponse<PagedResult<PostReportResponseDto>>> GetMyReportsAsync(Guid userId, int pageNumber, int pageSize)
    {
        var paged = await _reportRepository.GetMyReportsAsync(userId, pageNumber, pageSize);
        var dtos = paged.Items.Select(MapToDto).ToList();

        var result = new PagedResult<PostReportResponseDto>(dtos, pageNumber, pageSize, paged.TotalCount);
        return ApiResponse<PagedResult<PostReportResponseDto>>.Ok(result);
    }

    // =================================================
    // 3bis. NGƯỜI DÙNG XEM CHI TIẾT MỘT BÁO CÁO CỦA HỌ
    // =================================================

    public async Task<ApiResponse<PostReportResponseDto>> GetMyReportByIdAsync(Guid userId, Guid reportId)
    {
        var report = await _reportRepository.GetReportWithDetailsAsync(reportId);
        if (report == null || report.ReporterId != userId)
            return ApiResponse<PostReportResponseDto>.NotFound("Không tìm thấy báo cáo");

        return ApiResponse<PostReportResponseDto>.Ok(MapToDto(report));
    }

    // =================================================
    // 4. ADMIN/MOD: LẤY TOÀN BỘ BÁO CÁO (CÓ LỌC)
    // =================================================

    public async Task<ApiResponse<PagedResult<PostReportResponseDto>>> GetAllReportsAsync(
        int pageNumber,
        int pageSize,
        ReportStatus? status = null,
        ReportReason? reason = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null)
    {
        var paged = await _reportRepository.GetAllReportsAsync(pageNumber, pageSize, status, reason, fromDate, toDate);
        var dtos = paged.Items.Select(MapToDto).ToList();

        var result = new PagedResult<PostReportResponseDto>(dtos, pageNumber, pageSize, paged.TotalCount);
        return ApiResponse<PagedResult<PostReportResponseDto>>.Ok(result);
    }

    // =================================================
    // 5. XEM CHI TIẾT MỘT BÁO CÁO (ADMIN/MOD)
    // =================================================

    public async Task<ApiResponse<PostReportResponseDto>> GetReportByIdAsync(Guid reportId)
    {
        var report = await _reportRepository.GetReportWithDetailsAsync(reportId);
        if (report == null)
            return ApiResponse<PostReportResponseDto>.NotFound("Không tìm thấy báo cáo");

        return ApiResponse<PostReportResponseDto>.Ok(MapToDto(report));
    }

    // =================================================
    // 6. ADMIN/MOD: XỬ LÝ BÁO CÁO (GIẢI QUYẾT)
    // =================================================

    public async Task<ApiResponse> ResolveReportAsync(Guid adminId, Guid reportId, ResolveReportDto request)
    {
        var report = await _reportRepository.GetByIdAsync(reportId);
        if (report == null)
            return ApiResponse.NotFound("Không tìm thấy báo cáo");

        try
        {
            report.Resolve(adminId, request.Notes);
            await _reportRepository.SaveChangesAsync();

            // Gửi thông báo cho người đã báo cáo
            await SendReportOutcomeNotificationAsync(report.ReporterId, report.Id, ReportStatus.Resolved);

            return ApiResponse.Ok("Đã xử lý báo cáo thành công");
        }
        catch (InvalidOperationException ex)
        {
            return ApiResponse.Fail(ex.Message);
        }
    }

    // =================================================
    // 7. ADMIN/MOD: ĐÁNH DẤU ĐÃ XEM XÉT (REVIEWED)
    // =================================================

    public async Task<ApiResponse> MarkAsReviewedAsync(Guid adminId, Guid reportId)
    {
        var report = await _reportRepository.GetByIdAsync(reportId);
        if (report == null)
            return ApiResponse.NotFound("Không tìm thấy báo cáo");

        try
        {
            report.MarkAsReviewed(adminId);
            await _reportRepository.SaveChangesAsync();
            return ApiResponse.Ok("Báo cáo đã được đánh dấu là đang xem xét");
        }
        catch (InvalidOperationException ex)
        {
            return ApiResponse.Fail(ex.Message);
        }
    }

    // =================================================
    // 8. ADMIN/MOD: BÁC BỎ BÁO CÁO (DISMISS)
    // =================================================

    public async Task<ApiResponse> DismissReportAsync(Guid adminId, Guid reportId, ResolveReportDto request)
    {
        var report = await _reportRepository.GetByIdAsync(reportId);
        if (report == null)
            return ApiResponse.NotFound("Không tìm thấy báo cáo");

        try
        {
            report.Dismiss(adminId, request.Notes);
            await _reportRepository.SaveChangesAsync();

            // Gửi thông báo cho người đã báo cáo
            await SendReportOutcomeNotificationAsync(report.ReporterId, report.Id, ReportStatus.Dismissed);

            return ApiResponse.Ok("Báo cáo đã bị bác bỏ");
        }
        catch (InvalidOperationException ex)
        {
            return ApiResponse.Fail(ex.Message);
        }
    }

    // ====================== NOTIFICATION HELPERS ======================

    private async Task SendReportOutcomeNotificationAsync(Guid reporterId, Guid reportId, ReportStatus newStatus)
    {
        try
        {
            string statusText = newStatus switch
            {
                ReportStatus.Resolved => "đã được xử lý",
                ReportStatus.Dismissed => "đã bị bác bỏ",
                _ => "đã được cập nhật"
            };

            var notification = new CreateNotificationDto
            {
                ReceiverId = reporterId,
                TriggeredById = null,           // Hệ thống
                Type = NotificationType.System,
                Content = $"Báo cáo của bạn {statusText}.",
                TargetUrl = $"/reports/{reportId}",   // Frontend sẽ xử lý route
                RelatedEntityId = reportId,
                BypassUserSettings = true               // Thông báo quan trọng
            };

            await _notificationService.CreateNotificationAsync(notification);
        }
        catch
        {
            // Fire-and-forget, không làm gián đoạn flow chính
        }
    }

    // ====================== MAPPING & HELPERS ======================

    private static PostReportResponseDto MapToDto(PostReport r)
    {
        return new PostReportResponseDto
        {
            Id = r.Id,
            PostId = r.PostId,
            ReporterId = r.ReporterId,
            ReporterUserName = r.Reporter?.UserName ?? string.Empty,
            ReporterFullName = r.Reporter?.FullName ?? string.Empty,
            ReporterAvatarUrl = r.Reporter?.AvatarUrl,
            PostContent = r.Post?.Content ?? string.Empty,

            PostMediaUrl = r.Post?.MediaItems?
                .OrderBy(m => m.SortOrder)
                .FirstOrDefault()?.MediaUrl,

            PostAuthorUserName = r.Post?.User?.UserName ?? string.Empty,
            Reason = r.Reason,
            Details = r.Details,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            ProcessedById = r.ProcessedById,
            ProcessedByUserName = r.ProcessedBy?.UserName
        };
    }

    private static string GetReasonDescription(ReportReason reason) => reason switch
    {
        ReportReason.Spam => "Nội dung spam, quảng cáo không mong muốn",
        ReportReason.Harassment => "Bắt nạt / Quấy rối",
        ReportReason.HateSpeech => "Ngôn từ kích động thù địch",
        ReportReason.NudityOrSexualContent => "Nội dung khiêu dâm hoặc tình dục",
        ReportReason.Violence => "Bạo lực, hình ảnh gây sốc",
        ReportReason.FalseInformation => "Thông tin sai lệch / Fake news",
        ReportReason.Other => "Vi phạm khác",
        _ => "Vi phạm khác"
    };
}