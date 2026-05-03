// SocialGraphPlatform.Api/Controllers/NotificationsController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Domain.Enums;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/notifications")]
[ApiController]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly INotificationSettingsService _settingsService; // Thêm mới

    public NotificationsController(
        INotificationService notificationService,
        INotificationSettingsService settingsService) // Inject thêm
    {
        _notificationService = notificationService;
        _settingsService = settingsService; // Gán
    }

    /// <summary>
    /// Helper: Lấy UserId từ JWT Token.
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (Guid.TryParse(userIdClaim, out Guid userId))
            return userId;

        throw new UnauthorizedAccessException("Không thể xác thực danh tính người dùng.");
    }

    // =========================================================
    // 1. DANH SÁCH & TRẠNG THÁI THÔNG BÁO
    // =========================================================

    /// <summary>
    /// Lấy danh sách thông báo của người dùng hiện tại (phân trang, hỗ trợ lọc theo loại và trạng thái đọc).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<NotificationResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] NotificationType? type = null,
        [FromQuery] bool? unreadOnly = null)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _notificationService.GetNotificationsAsync(
            currentUserId, pageNumber, pageSize, type, unreadOnly);
        return Ok(response);
    }

    /// <summary>
    /// Lấy chi tiết một thông báo (kèm kiểm tra quyền sở hữu).
    /// </summary>
    [HttpGet("{notificationId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<NotificationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid notificationId)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _notificationService.GetByIdAsync(currentUserId, notificationId);

        if (!response.IsSuccess)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Lấy số lượng thông báo chưa đọc (dùng cho badge đỏ trên icon chuông).
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var currentUserId = GetCurrentUserId();
        var response = await _notificationService.GetUnreadCountAsync(currentUserId);
        return Ok(response);
    }

    /// <summary>
    /// Đánh dấu thông báo là đã đọc (hỗ trợ đánh dấu nhiều hoặc đánh dấu tất cả).
    /// </summary>
    [HttpPut("read")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkAsRead([FromBody] MarkAsReadDto request)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _notificationService.MarkAsReadAsync(currentUserId, request);

        return response.IsSuccess
            ? Ok(response)
            : BadRequest(response);
    }

    // =========================================================
    // 2. CÀI ĐẶT THÔNG BÁO (MỚI)
    // =========================================================

    /// <summary>
    /// Lấy cài đặt thông báo của người dùng hiện tại.
    /// </summary>
    [HttpGet("settings")]
    [ProducesResponseType(typeof(ApiResponse<NotificationSettingsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings()
    {
        var currentUserId = GetCurrentUserId();
        var settings = await _settingsService.GetSettingsAsync(currentUserId);
        // Nếu chưa có cài đặt, trả về thành công với dữ liệu null (UI có thể hiển thị mặc định)
        return Ok(ApiResponse<NotificationSettingsDto?>.Ok(settings));
    }

    /// <summary>
    /// Cập nhật cài đặt thông báo của người dùng hiện tại.
    /// </summary>
    [HttpPut("settings")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSettings([FromBody] NotificationSettingsDto dto)
    {
        if (dto == null)
            return BadRequest(ApiResponse.Fail("Dữ liệu cài đặt không được để trống."));

        var currentUserId = GetCurrentUserId();
        await _settingsService.UpdateSettingsAsync(currentUserId, dto);
        return Ok(ApiResponse.Ok("Cài đặt thông báo đã được cập nhật."));
    }

    // =========================================================
    // 3. TẠO MỚI THÔNG BÁO (ADMIN / SYSTEM)
    // =========================================================

    /// <summary>
    /// Tạo một thông báo mới (dành cho admin hoặc system service).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")] // Chỉ admin mới được gọi trực tiếp
    [ProducesResponseType(typeof(ApiResponse<NotificationResponseDto?>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateNotificationDto request)
    {
        var response = await _notificationService.CreateNotificationAsync(request);

        return response.IsSuccess
            ? Ok(response)
            : BadRequest(response);
    }

    /// <summary>
    /// Tạo nhiều thông báo cùng lúc (dành cho thông báo hệ thống hàng loạt).
    /// </summary>
    [HttpPost("bulk")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkCreate([FromBody] BulkCreateNotificationsDto bulkRequest)
    {
        var response = await _notificationService.BulkCreateNotificationsAsync(bulkRequest.Notifications);

        return response.IsSuccess
            ? Ok(response)
            : BadRequest(response);
    }

    // =========================================================
    // 4. DỌN DẸP THÔNG BÁO CÁ NHÂN
    // =========================================================

    /// <summary>
    /// Xóa các thông báo đã đọc quá hạn của người dùng hiện tại.
    /// </summary>
    [HttpDelete("cleanup")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteOld(
        [FromQuery] int olderThanDays = 90)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _notificationService.DeleteOldNotificationsAsync(currentUserId, olderThanDays);
        return Ok(response);
    }
}