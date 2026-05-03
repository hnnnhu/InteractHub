using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IUserSessionRepository : IGenericRepository<UserSession>
{
    /// <summary>
    /// Tìm kiếm một phiên đăng nhập dựa trên TokenId (JTI)
    /// </summary>
    Task<UserSession?> GetByTokenIdAsync(string tokenId);

    /// <summary>
    /// Lấy danh sách tất cả các phiên đăng nhập đang hoạt động của một User
    /// </summary>
    Task<IEnumerable<UserSession>> GetActiveSessionsByUserIdAsync(Guid userId);

    /// <summary>
    /// Kiểm tra nhanh xem một TokenId đã bị thu hồi (Revoked) hoặc hết hạn chưa
    /// </summary>
    Task<bool> IsSessionValidAsync(string tokenId);

    /// <summary>
    /// Thu hồi một phiên cụ thể theo ID
    /// </summary>
    Task<bool> RevokeSessionAsync(Guid sessionId);

    /// <summary>
    /// Thu hồi tất cả phiên đăng nhập của User (Đăng xuất từ xa mọi thiết bị)
    /// </summary>
    /// <param name="exceptTokenId">TokenId hiện tại muốn giữ lại (nếu có)</param>
    Task RevokeAllSessionsAsync(Guid userId, string? exceptTokenId = null);

    /// <summary>
    /// Cập nhật thời điểm hoạt động cuối cùng của phiên
    /// </summary>
    Task UpdateLastActiveAsync(string tokenId);

    /// <summary>
    /// Xóa các phiên đăng nhập đã hết hạn hoặc đã bị thu hồi từ lâu (Dọn dẹp DB)
    /// </summary>
    Task ClearExpiredSessionsAsync();
}