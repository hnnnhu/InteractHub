using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Report;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Domain.Enums;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/reports")]
[ApiController]
[Authorize] // 🔒 Mặc định tất cả endpoint đều cần đăng nhập
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Helper: Lấy UserId từ JWT Token
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out Guid userId)) return userId;
        throw new UnauthorizedAccessException("Không thể xác thực danh tính.");
    }

    // =========================================================
    // 1. NGƯỜI DÙNG GỬI BÁO CÁO (USER ACTIONS)
    // =========================================================

    /// <summary>
    /// Gửi một báo cáo vi phạm bài viết mới
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<IdDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateReport([FromBody] CreatePostReportDto request)
    {
        var userId = GetCurrentUserId();
        var response = await _reportService.CreatePostReportAsync(userId, request);

        if (!response.IsSuccess) return BadRequest(response);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Lấy danh sách các lý do báo cáo được hệ thống hỗ trợ
    /// </summary>
    [HttpGet("reasons")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<ReportReasonDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReasons()
    {
        var response = await _reportService.GetReportReasonsAsync();
        return Ok(response);
    }

    /// <summary>
    /// Xem lịch sử các báo cáo mà chính mình đã gửi (phân trang)
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PostReportResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyReports([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        var response = await _reportService.GetMyReportsAsync(userId, pageNumber, pageSize);
        return Ok(response);
    }

    /// <summary>
    /// Người dùng xem chi tiết một báo cáo của chính mình
    /// </summary>
    [HttpGet("me/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PostReportResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyReportDetail(Guid id)
    {
        var userId = GetCurrentUserId();
        var response = await _reportService.GetMyReportByIdAsync(userId, id);
        if (!response.IsSuccess) return NotFound(response);
        return Ok(response);
    }

    // =========================================================
    // 2. QUẢN TRỊ VIÊN XỬ LÝ (ADMIN / MODERATOR ACTIONS)
    // =========================================================

    /// <summary>
    /// Lấy toàn bộ danh sách báo cáo trên hệ thống (Dành cho Admin/Moderator),
    /// hỗ trợ lọc theo trạng thái, lý do và khoảng thời gian.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Moderator")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PostReportResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllReports(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ReportStatus? status = null,
        [FromQuery] ReportReason? reason = null,
        [FromQuery] DateTimeOffset? fromDate = null,
        [FromQuery] DateTimeOffset? toDate = null)
    {
        var response = await _reportService.GetAllReportsAsync(
            pageNumber, pageSize, status, reason, fromDate, toDate);
        return Ok(response);
    }

    /// <summary>
    /// Xem chi tiết nội dung của một bản ghi báo cáo cụ thể (Admin/Moderator)
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Moderator")]
    [ProducesResponseType(typeof(ApiResponse<PostReportResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReportDetail(Guid id)
    {
        var response = await _reportService.GetReportByIdAsync(id);
        if (!response.IsSuccess) return NotFound(response);
        return Ok(response);
    }

    /// <summary>
    /// Admin/Moderator xử lý và hoàn tất báo cáo (Resolve)
    /// </summary>
    [HttpPost("{id:guid}/resolve")]
    [Authorize(Roles = "Admin,Moderator")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResolveReport(Guid id, [FromBody] ResolveReportDto request)
    {
        var adminId = GetCurrentUserId();
        var response = await _reportService.ResolveReportAsync(adminId, id, request);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Admin/Moderator đánh dấu báo cáo là đang xem xét (Mark as Reviewed)
    /// </summary>
    [HttpPost("{id:guid}/review")]
    [Authorize(Roles = "Admin,Moderator")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkAsReviewed(Guid id)
    {
        var adminId = GetCurrentUserId();
        var response = await _reportService.MarkAsReviewedAsync(adminId, id);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Admin/Moderator bác bỏ báo cáo (Dismiss)
    /// </summary>
    [HttpPost("{id:guid}/dismiss")]
    [Authorize(Roles = "Admin,Moderator")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DismissReport(Guid id, [FromBody] ResolveReportDto request)
    {
        var adminId = GetCurrentUserId();
        var response = await _reportService.DismissReportAsync(adminId, id, request);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }
}