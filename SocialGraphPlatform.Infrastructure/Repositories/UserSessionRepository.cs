using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class UserSessionRepository : GenericRepository<UserSession>, IUserSessionRepository
{
    // Không khai báo lại _context ở đây để tránh lỗi Hiding/Shadowing. 
    // Chúng ta sử dụng trực tiếp _context từ GenericRepository.

    public UserSessionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<UserSession?> GetByTokenIdAsync(string tokenId)
    {
        return await _context.UserSessions
            .FirstOrDefaultAsync(x => x.TokenId == tokenId);
    }

    public async Task<IEnumerable<UserSession>> GetActiveSessionsByUserIdAsync(Guid userId)
    {
        return await _context.UserSessions
            .Where(x => x.UserId == userId && !x.IsRevoked && x.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(x => x.LastActiveAt)
            .ToListAsync();
    }

    public async Task<bool> IsSessionValidAsync(string tokenId)
    {
        return await _context.UserSessions
            .AnyAsync(x => x.TokenId == tokenId &&
                           !x.IsRevoked &&
                           x.ExpiresAt > DateTime.UtcNow);
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId)
    {
        var session = await _context.UserSessions.FindAsync(sessionId);
        if (session == null) return false;

        session.Revoke();
        await _context.SaveChangesAsync();
        return true;
    }

    // Sửa lỗi cú pháp Method Signature ở đây
    public async Task RevokeAllSessionsAsync(Guid userId, string? exceptTokenId = null)
    {
        var query = _context.UserSessions
            .Where(x => x.UserId == userId && !x.IsRevoked);

        if (!string.IsNullOrEmpty(exceptTokenId))
        {
            query = query.Where(x => x.TokenId != exceptTokenId);
        }

        var sessionsToRevoke = await query.ToListAsync();
        foreach (var session in sessionsToRevoke)
        {
            session.Revoke();
        }

        await _context.SaveChangesAsync();
    }

    public async Task UpdateLastActiveAsync(string tokenId)
    {
        await _context.UserSessions
            .Where(x => x.TokenId == tokenId)
            .ExecuteUpdateAsync(s => s.SetProperty(b => b.LastActiveAt, DateTime.UtcNow));
    }

    public async Task ClearExpiredSessionsAsync()
    {
        await _context.UserSessions
            .Where(x => x.ExpiresAt <= DateTime.UtcNow || x.IsRevoked)
            .ExecuteDeleteAsync();
    }
}