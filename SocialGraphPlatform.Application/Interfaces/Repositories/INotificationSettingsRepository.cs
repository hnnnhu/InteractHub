// SocialGraphPlatform.Application/Interfaces/Repositories/INotificationSettingsRepository.cs

using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface INotificationSettingsRepository
{
    Task<NotificationSettings?> GetByUserIdAsync(Guid userId);
    Task AddAsync(NotificationSettings settings);
    Task UpdateAsync(NotificationSettings settings);
}