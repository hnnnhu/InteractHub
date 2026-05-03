using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Notification;

public class BulkCreateNotificationsDto
{
    [Required]
    [MinLength(1, ErrorMessage = "Phải có ít nhất một thông báo.")]
    public List<CreateNotificationDto> Notifications { get; set; } = new();
}