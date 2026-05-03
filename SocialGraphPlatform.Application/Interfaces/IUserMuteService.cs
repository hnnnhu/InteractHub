// SocialGraphPlatform.Application/Interfaces/IUserMuteService.cs

namespace SocialGraphPlatform.Application.Interfaces;

/// <summary>
/// Dịch vụ quản lý mute giữa hai người dùng.
/// </summary>
public interface IUserMuteService
{
    /// <summary>
    /// Kiểm tra xem <paramref name="userId"/> có mute <paramref name="targetUserId"/> hay không.
    /// </summary>
    Task<bool> IsMutedAsync(Guid userId, Guid targetUserId);

    /// <summary>
    /// Mute một người dùng (có thể tạm thời hoặc vĩnh viễn).
    /// </summary>
    Task MuteUserAsync(Guid userId, Guid targetUserId, DateTime? muteEnd = null);

    /// <summary>
    /// Unmute một người dùng.
    /// </summary>
    Task UnmuteUserAsync(Guid userId, Guid targetUserId);
}