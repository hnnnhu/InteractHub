using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SocialGraphPlatform.Application.DTOs.Auth;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SocialGraphPlatform.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IUserSessionService _sessionService;
    private readonly INotificationService _notificationService;
    private readonly IServiceScopeFactory _scopeFactory; // Thêm để tạo scope cho background task

    public AuthService(
        UserManager<User> userManager,
        ITokenService tokenService,
        IEmailService emailService,
        IRefreshTokenRepository refreshTokenRepository,
        IUserSessionService sessionService,
        INotificationService notificationService,
        IServiceScopeFactory scopeFactory) // Inject thêm
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _refreshTokenRepository = refreshTokenRepository;
        _sessionService = sessionService;
        _notificationService = notificationService;
        _scopeFactory = scopeFactory;
    }

    private string GetJtiFromToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        if (handler.CanReadToken(token))
        {
            var jwtToken = handler.ReadJwtToken(token);
            var jti = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value
                      ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "jti")?.Value;

            if (!string.IsNullOrEmpty(jti)) return jti;
        }
        return Guid.NewGuid().ToString(); // Fallback an toàn
    }

    // ──────────────────────────────────────────────────────────────────────
    // 1. ĐĂNG KÝ
    // ──────────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request, string? ipAddress = null, string? deviceInfo = null)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            return ApiResponse<AuthResponseDto>.Fail("Email đã được sử dụng.");

        existingUser = await _userManager.FindByNameAsync(request.UserName);
        if (existingUser is not null)
            return ApiResponse<AuthResponseDto>.Fail("Tên đăng nhập đã được sử dụng.");

        var user = new User(request.FullName)
        {
            UserName = request.UserName,
            Email = request.Email
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = createResult.Errors.Select(e => e.Description).ToList();
            return ApiResponse<AuthResponseDto>.Fail("Đăng ký thất bại.", errors);
        }

        await _userManager.AddToRoleAsync(user, "User");

        // Gửi email chào mừng trong background (fire-and-forget thực sự)
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                await emailService.SendWelcomeEmailAsync(user.Email!, user.FullName);
            }
            catch
            {
                // Bỏ qua lỗi, không ảnh hưởng đến response
            }
        });

        // Lấy roles của user (mặc định "User" sau khi đăng ký)
        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, refreshToken, expiresAt, refreshExpiresAt) = _tokenService.GenerateTokens(user, roles);

        await _refreshTokenRepository.CreateAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow
        });

        var jti = GetJtiFromToken(accessToken);
        await _sessionService.CreateSessionAsync(
            user.Id,
            jti,
            refreshToken,
            deviceInfo,
            ipAddress,
            expiresAt - DateTime.UtcNow
        );

        // Gửi thông báo chào mừng (có thể vẫn để await vì nhanh, hoặc cũng cho vào background nếu muốn)
        try
        {
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                ReceiverId = user.Id,
                TriggeredById = null, // hệ thống
                Type = NotificationType.System,
                Content = "🎉 Chào mừng bạn đến với SocialGraph! Hãy kết nối với bạn bè ngay nào.",
                TargetUrl = "/feed",
                BypassUserSettings = true
            });
        }
        catch { /* không làm gián đoạn đăng ký */ }

        var authResponse = new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            SessionId = Guid.Empty,
            ExpiresAt = expiresAt,
            RefreshTokenExpiresAt = refreshExpiresAt,
            UserId = user.Id,
            UserName = user.UserName!,
            FullName = user.FullName,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio
        };

        return ApiResponse<AuthResponseDto>.Ok(authResponse, "Đăng ký thành công.");
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. ĐĂNG NHẬP
    // ──────────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request, string? ipAddress = null, string? deviceInfo = null)
    {
        var user = await _userManager.FindByEmailAsync(request.EmailOrUserName)
                   ?? await _userManager.FindByNameAsync(request.EmailOrUserName);

        if (user is null)
            return ApiResponse<AuthResponseDto>.Fail("Email/Tên đăng nhập hoặc mật khẩu không đúng.");

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
            return ApiResponse<AuthResponseDto>.Fail("Email/Tên đăng nhập hoặc mật khẩu không đúng.");

        if (await _userManager.IsLockedOutAsync(user))
            return ApiResponse<AuthResponseDto>.Fail("Tài khoản đã bị khoá tạm thời. Vui lòng thử lại sau.");

        if (user.IsDeleted)
            return ApiResponse<AuthResponseDto>.Fail("Tài khoản đã bị vô hiệu hóa.");

        // Lấy roles của user trước khi tạo token
        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, refreshToken, expiresAt, refreshExpiresAt) = _tokenService.GenerateTokens(user, roles);

        await _refreshTokenRepository.RevokeAllForUserAsync(user.Id);

        await _refreshTokenRepository.CreateAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow
        });

        var jti = GetJtiFromToken(accessToken);
        await _sessionService.CreateSessionAsync(
            user.Id,
            jti,
            refreshToken,
            deviceInfo,
            ipAddress,
            expiresAt - DateTime.UtcNow
        );

        var authResponse = new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            SessionId = Guid.Empty,
            ExpiresAt = expiresAt,
            RefreshTokenExpiresAt = refreshExpiresAt,
            UserId = user.Id,
            UserName = user.UserName!,
            FullName = user.FullName,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio
        };

        return ApiResponse<AuthResponseDto>.Ok(authResponse, "Đăng nhập thành công.");
    }

    // ──────────────────────────────────────────────────────────────────────
    // 3. LÀM MỚI TOKEN
    // ──────────────────────────────────────────────────────────────────────
    public async Task<ApiResponse<TokenResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, string? ipAddress = null, string? deviceInfo = null)
    {
        var principal = _tokenService.GetPrincipalFromExpiredToken(request.Token);
        if (principal is null)
            return ApiResponse<TokenResponseDto>.Fail("Access token không hợp lệ.");

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? principal.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return ApiResponse<TokenResponseDto>.Fail("Token không chứa thông tin người dùng.");

        var storedToken = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
        if (storedToken is null || storedToken.UserId != userId)
            return ApiResponse<TokenResponseDto>.Fail("Refresh token không hợp lệ.");

        if (!await _refreshTokenRepository.IsTokenValidAsync(request.RefreshToken))
            return ApiResponse<TokenResponseDto>.Fail("Refresh token đã hết hạn hoặc bị thu hồi.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null || user.IsDeleted)
            return ApiResponse<TokenResponseDto>.Fail("Người dùng không tồn tại hoặc đã bị vô hiệu hóa.");

        await _refreshTokenRepository.RevokeAsync(storedToken);

        // Lấy roles của user và tạo token mới kèm roles
        var roles = await _userManager.GetRolesAsync(user);
        var (newAccessToken, newRefreshToken, expiresAt, refreshExpiresAt) = _tokenService.GenerateTokens(user, roles);

        await _refreshTokenRepository.CreateAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = refreshExpiresAt,
            CreatedAt = DateTime.UtcNow
        });

        var newJti = GetJtiFromToken(newAccessToken);
        await _sessionService.CreateSessionAsync(
            user.Id,
            newJti,
            newRefreshToken,
            deviceInfo,
            ipAddress,
            expiresAt - DateTime.UtcNow
        );

        var tokenResponse = new TokenResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            SessionId = Guid.Empty,
            ExpiresAt = expiresAt
        };

        return ApiResponse<TokenResponseDto>.Ok(tokenResponse, "Làm mới token thành công.");
    }

    // ──────────────────────────────────────────────────────────────────────
    // 4. ĐĂNG XUẤT (THU HỒI TOKEN)
    // ──────────────────────────────────────────────────────────────────────
    public async Task<ApiResponse> LogoutAsync(LogoutRequestDto request)
    {
        var storedToken = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);

        if (storedToken != null)
        {
            await _refreshTokenRepository.RevokeAsync(storedToken);
        }

        return ApiResponse.Ok("Đăng xuất thành công.");
    }

    // ──────────────────────────────────────────────────────────────────────
    // 5. QUÊN MẬT KHẨU & ĐẶT LẠI MẬT KHẨU
    // ──────────────────────────────────────────────────────────────────────
    public async Task<ApiResponse> ForgotPasswordAsync(ForgotPasswordRequestDto request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is null || user.IsDeleted)
            return ApiResponse.Ok("Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.");

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email!, user.FullName, resetToken);
        }
        catch
        {
            return ApiResponse.Error("Không thể gửi email. Vui lòng thử lại sau.");
        }

        return ApiResponse.Ok("Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.");
    }

    public async Task<ApiResponse> ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || user.IsDeleted)
            return ApiResponse.Fail("Yêu cầu không hợp lệ.");

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse.Fail("Đặt lại mật khẩu thất bại.", errors);
        }

        await _refreshTokenRepository.RevokeAllForUserAsync(user.Id);
        await _sessionService.RevokeAllSessionsAsync(user.Id);

        return ApiResponse.Ok("Mật khẩu đã được đặt lại thành công.");
    }
}