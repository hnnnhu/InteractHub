// SocialGraphPlatform.Application/Interfaces/Repositories/IUserMuteRepository.cs

using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IUserMuteRepository
{
    Task<bool> IsMutedAsync(Guid userId, Guid targetUserId);
    Task<UserMute?> GetMuteAsync(Guid userId, Guid targetUserId);
    Task AddAsync(UserMute mute);
    Task DeleteAsync(UserMute mute);
}