// SocialGraphPlatform.Infrastructure/Services/NotificationSettingsService.cs

using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services;

public class NotificationSettingsService : INotificationSettingsService
{
    private readonly INotificationSettingsRepository _repository;

    public NotificationSettingsService(INotificationSettingsRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> CanSendNotificationAsync(Guid userId, NotificationType type)
    {
        var settings = await _repository.GetByUserIdAsync(userId);
        if (settings == null)
            return true; // Chưa có cài đặt => cho phép tất cả

        return settings.IsTypeEnabled(type);
    }

    public async Task<NotificationSettingsDto?> GetSettingsAsync(Guid userId)
    {
        var settings = await _repository.GetByUserIdAsync(userId);
        if (settings == null)
            return null;

        return new NotificationSettingsDto
        {
            EnableAllNotifications = settings.EnableAllNotifications,
            FriendRequest = settings.FriendRequest,
            FriendAccepted = settings.FriendAccepted,
            PostReaction = settings.PostReaction,
            PostComment = settings.PostComment,
            StoryReaction = settings.StoryReaction,
            Mention = settings.Mention,
            PushEnabled = settings.PushEnabled,
            QuietHoursEnabled = settings.QuietHoursEnabled,
            QuietHoursStart = settings.QuietHoursStart,
            QuietHoursEnd = settings.QuietHoursEnd,
            EnableEmailNotification = settings.EnableEmailNotification
        };
    }

    public async Task UpdateSettingsAsync(Guid userId, NotificationSettingsDto dto)
    {
        var settings = await _repository.GetByUserIdAsync(userId);

        if (settings == null)
        {
            settings = new NotificationSettings(userId);
            ApplyDto(settings, dto);
            await _repository.AddAsync(settings);
        }
        else
        {
            // Vì entity được tracked khi lấy từ DB, ta có thể cập nhật trực tiếp
            settings.UpdateFromDto(
                dto.EnableAllNotifications,
                dto.FriendRequest,
                dto.FriendAccepted,
                dto.PostReaction,
                dto.PostComment,
                dto.StoryReaction,
                dto.Mention,
                dto.PushEnabled,
                dto.QuietHoursEnabled,
                dto.QuietHoursStart,
                dto.QuietHoursEnd,
                dto.EnableEmailNotification
            );
            await _repository.UpdateAsync(settings);
        }
    }

    private void ApplyDto(NotificationSettings settings, NotificationSettingsDto dto)
    {
        settings.UpdateFromDto(
            dto.EnableAllNotifications,
            dto.FriendRequest,
            dto.FriendAccepted,
            dto.PostReaction,
            dto.PostComment,
            dto.StoryReaction,
            dto.Mention,
            dto.PushEnabled,
            dto.QuietHoursEnabled,
            dto.QuietHoursStart,
            dto.QuietHoursEnd,
            dto.EnableEmailNotification
        );
    }
}