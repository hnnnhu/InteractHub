namespace SocialGraphPlatform.Application.DTOs.Block;

public class BlockedUserDto
{
    public Guid BlockId { get; set; }
    public Guid BlockedId { get; set; }

    // Thông tin người bị chặn
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }

    public DateTimeOffset BlockedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

}