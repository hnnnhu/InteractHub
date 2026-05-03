using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialGraphPlatform.Domain.Entities;

public class UserSession
{
    [Key]
    public Guid Id { get; private set; }

    [Required]
    public Guid UserId { get; private set; }

    // Liên kết với Token JTI (Json Token Identifier) để định danh chính xác JWT
    [Required]
    public string TokenId { get; private set; } = string.Empty;

    // Lưu Refresh Token (hoặc Hash) để quản lý việc gia hạn phiên
    [Required]
    public string RefreshToken { get; private set; } = string.Empty;

    // Thông tin thiết bị (Ví dụ: "Chrome on Windows 11", "iPhone 15 - App")
    public string? DeviceInfo { get; private set; }

    // Địa chỉ IP lúc đăng nhập
    public string? IpAddress { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }

    // Thời điểm hoạt động cuối cùng (để biết thiết bị nào đang dùng)
    public DateTime LastActiveAt { get; private set; }

    // Trạng thái thu hồi
    public bool IsRevoked { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    // Navigation property
    [ForeignKey(nameof(UserId))]
    public virtual User User { get; private set; } = null!;

    // ── CONSTRUCTORS ──
    private UserSession() { } // Dùng cho EF Core

    public UserSession(
        Guid userId,
        string tokenId,
        string refreshToken,
        string? deviceInfo,
        string? ipAddress,
        TimeSpan duration)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        TokenId = tokenId;
        RefreshToken = refreshToken;
        DeviceInfo = deviceInfo;
        IpAddress = ipAddress;
        CreatedAt = DateTime.UtcNow;
        LastActiveAt = DateTime.UtcNow;
        ExpiresAt = DateTime.UtcNow.Add(duration);
        IsRevoked = false;
    }

    // ── DOMAIN BEHAVIORS ──

    /// <summary>
    /// Thu hồi phiên làm việc (Đăng xuất thiết bị)
    /// </summary>
    public void Revoke()
    {
        if (!IsRevoked)
        {
            IsRevoked = true;
            RevokedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Cập nhật thời gian hoạt động cuối cùng
    /// </summary>
    public void UpdateActivity()
    {
        LastActiveAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Kiểm tra phiên còn hiệu lực hay không
    /// </summary>
    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;
}