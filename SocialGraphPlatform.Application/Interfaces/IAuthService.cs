using SocialGraphPlatform.Application.DTOs.Auth;
using SocialGraphPlatform.Application.DTOs.Common;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IAuthService
{
    /// <summary>
    /// Đăng ký tài khoản mới và tự động khởi tạo phiên đăng nhập (Session).
    /// </summary>
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request, string? ipAddress = null, string? deviceInfo = null);

    /// <summary>
    /// Đăng nhập vào hệ thống, cấp Token và ghi nhận thông tin thiết bị/IP.
    /// </summary>
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request, string? ipAddress = null, string? deviceInfo = null);

    /// <summary>
    /// Làm mới Access Token bằng Refresh Token và cập nhật lại phiên hoạt động.
    /// </summary>
    Task<ApiResponse<TokenResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, string? ipAddress = null, string? deviceInfo = null);

    /// <summary>
    /// Đăng xuất khỏi thiết bị hiện tại (Thu hồi Refresh Token).
    /// </summary>
    Task<ApiResponse> LogoutAsync(LogoutRequestDto request);

    /// <summary>
    /// Quên mật khẩu - Gửi email chứa token hướng dẫn đặt lại mật khẩu.
    /// </summary>
    Task<ApiResponse> ForgotPasswordAsync(ForgotPasswordRequestDto request);

    /// <summary>
    /// Đặt lại mật khẩu mới (Sau khi thành công sẽ tự động thu hồi toàn bộ các phiên đăng nhập khác để bảo mật).
    /// </summary>
    Task<ApiResponse> ResetPasswordAsync(ResetPasswordRequestDto request);
}