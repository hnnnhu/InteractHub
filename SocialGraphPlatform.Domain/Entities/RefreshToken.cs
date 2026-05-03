// SocialGraphPlatform.Domain/Entities/RefreshToken.cs
namespace SocialGraphPlatform.Domain.Entities;

/// <summary>
/// Entity lưu trữ Refresh Token
/// </summary>
public class RefreshToken
{
    /// <summary>
    /// Khóa chính
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Chuỗi refresh token
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// ID của user sở hữu token
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Thời gian hết hạn
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Đã bị thu hồi chưa
    /// </summary>
    public bool IsRevoked { get; set; }

    /// <summary>
    /// Thời gian tạo
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Thời gian thu hồi (nếu có)
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// IP address của client (tùy chọn)
    /// </summary>
    public string? CreatedByIp { get; set; }

    /// <summary>
    /// User Agent của client (tùy chọn)
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Device ID (tùy chọn)
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Navigation property đến User
    /// </summary>
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Kiểm tra token có còn hiệu lực không
    /// </summary>
    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}