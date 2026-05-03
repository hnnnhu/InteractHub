using System.ComponentModel.DataAnnotations;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.User;

public record UpdatePrivacyDto
{
    [Required(ErrorMessage = "Vui lòng chọn mức độ quyền riêng tư.")]
    public PrivacyLevel ProfileVisibility { get; init; }
}