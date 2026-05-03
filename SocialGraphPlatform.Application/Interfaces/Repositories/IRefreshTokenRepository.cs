using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IRefreshTokenRepository
{
    Task CreateAsync(RefreshToken refreshToken);
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task RevokeAsync(RefreshToken refreshToken);
    Task RevokeAllForUserAsync(Guid userId);
    Task<bool> IsTokenValidAsync(string token);
}