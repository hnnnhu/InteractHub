using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.User;

public record RevokeSessionRequest
{
    [Required(ErrorMessage = "ID phiên đăng nhập là bắt buộc.")]
    public Guid SessionId { get; init; }
}