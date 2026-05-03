// SocialGraphPlatform.Infrastructure/Repositories/NotificationSettingsRepository.cs

using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class NotificationSettingsRepository : INotificationSettingsRepository
{
    private readonly AppDbContext _context;

    public NotificationSettingsRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationSettings?> GetByUserIdAsync(Guid userId)
    {
        return await _context.NotificationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task AddAsync(NotificationSettings settings)
    {
        await _context.NotificationSettings.AddAsync(settings);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(NotificationSettings settings)
    {
        _context.NotificationSettings.Update(settings);
        await _context.SaveChangesAsync();
    }
}