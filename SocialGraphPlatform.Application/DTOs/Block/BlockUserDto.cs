using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Block;

public class BlockUserDto
{
    [Required(ErrorMessage = "Vui lòng chọn người dùng để chặn")]
    public Guid BlockedId { get; set; }
}