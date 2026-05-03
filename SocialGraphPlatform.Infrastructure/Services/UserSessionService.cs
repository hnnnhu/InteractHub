using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Services;

public class UserSessionService : IUserSessionService
{
    private readonly IUserSessionRepository _sessionRepository;

    public UserSessionService(IUserSessionRepository sessionRepository)
    {
        _sessionRepository = sessionRepository;
    }

    public async Task<ApiResponse<IEnumerable<SessionDto>>> GetActiveSessionsAsync(Guid userId, string currentTokenId)
    {
        var sessions = await _sessionRepository.GetActiveSessionsByUserIdAsync(userId);

        var dtos = sessions.Select(s => new SessionDto
        {
            Id = s.Id,
            DeviceInfo = s.DeviceInfo,
            IpAddress = s.IpAddress,
            CreatedAt = s.CreatedAt,
            LastActiveAt = s.LastActiveAt,
            // Logic quan trọng: Đánh dấu thiết bị người dùng đang cầm trên tay
            IsCurrent = s.TokenId == currentTokenId
        });

        return ApiResponse<IEnumerable<SessionDto>>.Ok(dtos);
    }

    public async Task<ApiResponse> RevokeSessionAsync(Guid userId, Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);

        if (session == null)
            return ApiResponse.NotFound("Không tìm thấy phiên đăng nhập.");

        // Bảo mật: Kiểm tra xem phiên này có thuộc về chính chủ hay không
        if (session.UserId != userId)
            return ApiResponse.Fail("Bạn không có quyền hủy phiên đăng nhập này.");

        session.Revoke();
        await _sessionRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đã đăng xuất thiết bị thành công.");
    }

    public async Task<ApiResponse> RevokeAllOtherSessionsAsync(Guid userId, string currentTokenId)
    {
        // Thu hồi tất cả, ngoại trừ token hiện tại
        await _sessionRepository.RevokeAllSessionsAsync(userId, currentTokenId);
        return ApiResponse.Ok("Đã đăng xuất khỏi tất cả các thiết bị khác.");
    }

    public async Task<ApiResponse> RevokeAllSessionsAsync(Guid userId)
    {
        await _sessionRepository.RevokeAllSessionsAsync(userId);
        return ApiResponse.Ok("Đã đăng xuất khỏi tất cả các thiết bị.");
    }

    public async Task<bool> IsSessionValidAsync(string tokenId)
    {
        // Middleware sẽ gọi hàm này. Nó kiểm tra IsRevoked và ExpiresAt.
        return await _sessionRepository.IsSessionValidAsync(tokenId);
    }

    public async Task UpdateActivityAsync(string tokenId)
    {
        // Ghi lại dấu vết hoạt động cuối cùng của Token
        await _sessionRepository.UpdateLastActiveAsync(tokenId);
    }

    public async Task CreateSessionAsync(Guid userId, string tokenId, string refreshToken, string? deviceInfo, string? ipAddress, TimeSpan duration)
    {
        var session = new UserSession(
            userId,
            tokenId,
            refreshToken,
            deviceInfo,
            ipAddress,
            duration
        );

        await _sessionRepository.AddAsync(session);
        await _sessionRepository.SaveChangesAsync();
    }
}