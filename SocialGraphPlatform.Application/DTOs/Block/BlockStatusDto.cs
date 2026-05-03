// SocialGraphPlatform.Application/DTOs/Block/BlockStatusDto.cs
namespace SocialGraphPlatform.Application.DTOs.Block;

public class BlockStatusDto
{
    /// <summary>
    /// True nếu CurrentUser đang chặn TargetUser
    /// </summary>
    public bool IsBlockedByMe { get; set; }

    /// <summary>
    /// True nếu TargetUser đang chặn CurrentUser
    /// </summary>
    public bool HasBlockedMe { get; set; }

    /// <summary>
    /// Bất kỳ ai trong 2 người chặn người kia thì sẽ là true (không thể tương tác)
    /// </summary>
    public bool IsAnyBlocked => IsBlockedByMe || HasBlockedMe;
}