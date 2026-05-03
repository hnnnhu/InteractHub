using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.User;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IUserSessionService
{
    /// <summary>
    /// Lấy danh sách tất cả các phiên đăng nhập (thiết bị) đang hoạt động của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng hiện tại.</param>
    /// <param name="currentTokenId">JTI của Token đang sử dụng để đánh dấu phiên hiện tại.</param>
    Task<ApiResponse<IEnumerable<SessionDto>>> GetActiveSessionsAsync(Guid userId, string currentTokenId);

    /// <summary>
    /// Hủy một phiên đăng nhập cụ thể (Đăng xuất từ xa một thiết bị).
    /// </summary>
    /// <param name="userId">ID người dùng thực hiện (để đảm bảo tính chính chủ).</param>
    /// <param name="sessionId">ID của phiên muốn hủy.</param>
    Task<ApiResponse> RevokeSessionAsync(Guid userId, Guid sessionId);

    /// <summary>
    /// Hủy tất cả các phiên đăng nhập khác, ngoại trừ phiên hiện tại.
    /// </summary>
    Task<ApiResponse> RevokeAllOtherSessionsAsync(Guid userId, string currentTokenId);

    /// <summary>
    /// Hủy toàn bộ phiên đăng nhập (Đăng xuất khỏi tất cả thiết bị).
    /// </summary>
    Task<ApiResponse> RevokeAllSessionsAsync(Guid userId);

    /// <summary>
    /// Kiểm tra tính hợp lệ của một Token (Dùng cho Middleware).
    /// Kiểm tra xem Token đã bị thu hồi (Revoked) hoặc User đã bị khóa/xóa hay chưa.
    /// </summary>
    Task<bool> IsSessionValidAsync(string tokenId);

    /// <summary>
    /// Cập nhật thời điểm hoạt động cuối cùng của phiên đăng nhập.
    /// </summary>
    Task UpdateActivityAsync(string tokenId);

    /// <summary>
    /// Tạo một phiên đăng nhập mới (Gọi khi Login thành công).
    /// </summary>
    Task CreateSessionAsync(Guid userId, string tokenId, string refreshToken, string? deviceInfo, string? ipAddress, TimeSpan duration);
}