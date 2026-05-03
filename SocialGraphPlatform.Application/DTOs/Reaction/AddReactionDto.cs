using System.ComponentModel.DataAnnotations;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Reaction;

public class AddReactionDto
{
    [Required(ErrorMessage = "Bài viết không tồn tại")]
    public Guid PostId { get; set; }

    [Required(ErrorMessage = "Loại cảm xúc là bắt buộc")]
    public ReactionType Type { get; set; } = ReactionType.Like;
}