// SocialGraphPlatform.Infrastructure/Providers/BlockedUserProvider.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.Providers;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Providers;

public class BlockedUserProvider : IBlockedUserProvider
{
    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private HashSet<Guid>? _excludedUserIds; // Lưu cache trong phạm vi 1 Request (Scoped)

    public BlockedUserProvider(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<HashSet<Guid>> GetExcludedUserIdsAsync()
    {
        // Tránh query DB nhiều lần trong cùng 1 request
        if (_excludedUserIds != null) return _excludedUserIds;

        var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
        {
            return new HashSet<Guid>(); // Trả về set rỗng nếu user chưa đăng nhập
        }

        // Lấy danh sách những người mình chặn VÀ những người chặn mình
        var blockedIds = await _dbContext.Blocks
            .AsNoTracking()
            .Where(b => !b.IsDeleted && (b.BlockerId == currentUserId || b.BlockedId == currentUserId))
            .Select(b => b.BlockerId == currentUserId ? b.BlockedId : b.BlockerId)
            .ToListAsync();

        _excludedUserIds = new HashSet<Guid>(blockedIds);
        return _excludedUserIds;
    }

    public void InvalidateCache()
    {
        _excludedUserIds = null; // Reset cache
    }
}