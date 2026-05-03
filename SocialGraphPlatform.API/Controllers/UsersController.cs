using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.API.Extensions;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.DTOs.Users;
using SocialGraphPlatform.Application.Interfaces;
using static SocialGraphPlatform.Application.DTOs.User.UserSummaryDto;

namespace SocialGraphPlatform.API.Controllers;

[Route("api/users")]
[ApiController]
[Authorize] // 🔒 Tất cả endpoint đều yêu cầu đăng nhập
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IUserSessionService _sessionService;

    public UsersController(IUserService userService, IUserSessionService sessionService)
    {
        _userService = userService;
        _sessionService = sessionService;
    }

    // ================================================================
    // 1. QUẢN LÝ PROFILE
    // ================================================================

    /// <summary>
    /// Lấy thông tin profile của chính mình
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUserProfile()
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.GetUserProfileAsync(currentUserId, currentUserId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    /// <summary>
    /// Lấy thông tin profile của người khác theo UserId (GUID)
    /// </summary>
    [HttpGet("{targetUserId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserProfile(Guid targetUserId)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.GetUserProfileAsync(currentUserId, targetUserId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    /// <summary>
    /// Lấy thông tin profile theo Username
    /// </summary>
    [HttpGet("profile/{username}")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfileByUsername(string username)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.GetUserProfileByUsernameAsync(currentUserId, username);

        if (!response.IsSuccess)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Cập nhật thông tin profile cá nhân
    /// </summary>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.UpdateProfileAsync(currentUserId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Tìm kiếm người dùng theo tên hoặc username có phân trang
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchUsers([FromQuery] UserSearchDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.SearchUsersAsync(currentUserId, request);
        return Ok(response);
    }

    /// <summary>
    /// Lấy các chỉ số thống kê của một user (Bài viết, bạn bè...)
    /// </summary>
    [HttpGet("{userId:guid}/stats")]
    [ProducesResponseType(typeof(ApiResponse<UserStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserStats(Guid userId)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.GetUserStatsAsync(currentUserId, userId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    // ================================================================
    // 2. QUẢN LÝ PHIÊN ĐĂNG NHẬP (SESSIONS) 🚀
    // ================================================================

    /// <summary>
    /// Lấy danh sách phiên đăng nhập đang hoạt động
    /// </summary>
    [HttpGet("me/sessions")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SessionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions()
    {
        var currentUserId = User.GetUserId();
        // Không dùng JTI, truyền chuỗi rỗng vào để by-pass logic IsCurrent
        var response = await _sessionService.GetActiveSessionsAsync(currentUserId, string.Empty);
        return Ok(response);
    }

    /// <summary>
    /// Đăng xuất một thiết bị khác (hủy phiên)
    /// </summary>
    [HttpDelete("me/sessions/{sessionId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        var currentUserId = User.GetUserId();
        var response = await _sessionService.RevokeSessionAsync(currentUserId, sessionId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Đăng xuất tất cả các thiết bị khác
    /// </summary>
    [HttpPost("me/logout-others")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> LogoutOtherDevices()
    {
        var currentUserId = User.GetUserId();
        var response = await _sessionService.RevokeAllOtherSessionsAsync(currentUserId, string.Empty);
        return Ok(response);
    }

    /// <summary>
    /// Đăng xuất tất cả các thiết bị (hoặc tất cả)
    /// </summary>
    [HttpPost("me/logout-all")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> LogoutAllDevices()
    {
        var currentUserId = User.GetUserId();
        var response = await _sessionService.RevokeAllSessionsAsync(currentUserId);
        return Ok(response);
    }

    // ================================================================
    // 3. BẢO MẬT & 2FA
    // ================================================================

    /// <summary>
    /// Thực hiện đổi mật khẩu
    /// </summary>
    [HttpPut("change-password")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.ChangePasswordAsync(currentUserId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Lấy thông tin cài đặt 2FA (Secret Key & QR Code URI)
    /// </summary>
    [HttpGet("me/2fa/setup")]
    [ProducesResponseType(typeof(ApiResponse<TwoFactorSetupDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTwoFactorSetup()
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.GetTwoFactorSetupAsync(currentUserId);
        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    /// <summary>
    /// Xác nhận mã và bật 2FA (Trả về danh sách 10 mã khôi phục)
    /// </summary>
    [HttpPost("me/2fa/enable")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<string>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EnableTwoFactor([FromBody] VerifyTwoFactorDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.EnableTwoFactorAsync(currentUserId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Vô hiệu hóa 2FA (Yêu cầu mã xác thực hiện tại)
    /// </summary>
    [HttpPost("me/2fa/disable")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DisableTwoFactor([FromBody] VerifyTwoFactorDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.DisableTwoFactorAsync(currentUserId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Tạo mới mã khôi phục 2FA
    /// </summary>
    [HttpPost("me/2fa/recovery-codes")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<string>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateRecoveryCodes()
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.GenerateTwoFactorRecoveryCodesAsync(currentUserId);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    // ================================================================
    // 4. UPLOAD HÌNH ẢNH (AVATAR & COVER)
    // ================================================================

    /// <summary>
    /// Upload và cập nhật ảnh đại diện mới
    /// </summary>
    [HttpPost("me/avatar")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar([FromForm] UploadImageDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.UpdateAvatarAsync(currentUserId, request.File);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Upload và cập nhật ảnh bìa mới
    /// </summary>
    [HttpPost("me/cover-photo")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadCoverPhoto([FromForm] UploadImageDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.UpdateCoverPhotoAsync(currentUserId, request.File);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    // ================================================================
    // 5. CÀI ĐẶT QUYỀN RIÊNG TƯ & XÓA TÀI KHOẢN
    // ================================================================

    /// <summary>
    /// Cập nhật quyền riêng tư của trang cá nhân
    /// </summary>
    [HttpPut("me/privacy")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePrivacySettings([FromBody] UpdatePrivacyDto request)
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.UpdatePrivacySettingsAsync(currentUserId, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Người dùng tự vô hiệu hóa tài khoản của mình (Soft Delete)
    /// </summary>
    [HttpDelete("deactivate")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateAccount()
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.DeactivateAccountAsync(currentUserId);

        if (!response.IsSuccess)
        {
            if (response.Message.Contains("Không tìm thấy"))
                return NotFound(response);
            return BadRequest(response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Khôi phục tài khoản đã bị vô hiệu hóa (trong vòng 30 ngày)
    /// </summary>
    [HttpPost("me/restore")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreAccount()
    {
        var currentUserId = User.GetUserId();
        var response = await _userService.RestoreAccountAsync(currentUserId);

        if (!response.IsSuccess)
        {
            if (response.Message.Contains("Không tìm thấy"))
                return NotFound(response);
            return BadRequest(response);
        }

        return Ok(response);
    }
}