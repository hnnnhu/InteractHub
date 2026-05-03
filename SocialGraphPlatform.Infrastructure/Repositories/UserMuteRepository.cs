// SocialGraphPlatform.Infrastructure/Repositories/UserMuteRepository.cs

using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class UserMuteRepository : IUserMuteRepository
{
    private readonly AppDbContext _context;

    public UserMuteRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> IsMutedAsync(Guid userId, Guid targetUserId)
    {
        return await _context.UserMutes
            .AnyAsync(m => m.UserId == userId
                           && m.MutedUserId == targetUserId
                           && (m.MuteEnd == null || m.MuteEnd > DateTimeOffset.UtcNow));
    }

    public async Task<UserMute?> GetMuteAsync(Guid userId, Guid targetUserId)
    {
        return await _context.UserMutes
            .FirstOrDefaultAsync(m => m.UserId == userId
                                     && m.MutedUserId == targetUserId
                                     && (m.MuteEnd == null || m.MuteEnd > DateTimeOffset.UtcNow));
    }

    public async Task AddAsync(UserMute mute)
    {
        await _context.UserMutes.AddAsync(mute);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(UserMute mute)
    {
        _context.UserMutes.Remove(mute);
        await _context.SaveChangesAsync();
    }
}