// SocialGraphPlatform.Infrastructure/Repositories/ReportRepository.cs

using Microsoft.EntityFrameworkCore;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data;

namespace SocialGraphPlatform.Infrastructure.Repositories;

public class ReportRepository : GenericRepository<PostReport>, IReportRepository
{
    public ReportRepository(AppDbContext context) : base(context) { }

    public async Task<PagedResult<PostReport>> GetMyReportsAsync(Guid userId, int pageNumber, int pageSize)
    {
        var query = _context.PostReports
            .AsNoTracking()
            .Where(r => r.ReporterId == userId && !r.IsDeleted)
            .Include(r => r.Post)
                .ThenInclude(p => p.User)
            .Include(r => r.Post)
                .ThenInclude(p => p.MediaItems)
            .Include(r => r.Reporter)
            .Include(r => r.ProcessedBy)                 // Bổ sung: hiển thị người xử lý nếu có
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<PostReport>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<PagedResult<PostReport>> GetAllReportsAsync(
        int pageNumber,
        int pageSize,
        ReportStatus? status = null,
        ReportReason? reason = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null)
    {
        var query = _context.PostReports
            .AsNoTracking()
            .Where(r => !r.IsDeleted);

        // Áp dụng các bộ lọc (nếu có)
        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (reason.HasValue)
            query = query.Where(r => r.Reason == reason.Value);

        if (fromDate.HasValue)
            query = query.Where(r => r.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(r => r.CreatedAt <= toDate.Value);

        // Include các thông tin liên quan
        query = query
            .Include(r => r.Post)
                .ThenInclude(p => p.User)
            .Include(r => r.Post)
                .ThenInclude(p => p.MediaItems)
            .Include(r => r.Reporter)
            .Include(r => r.ProcessedBy)                 // Cho phép hiển thị tên người xử lý
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<PostReport>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<PostReport?> GetReportWithDetailsAsync(Guid reportId)
    {
        return await _context.PostReports
            .AsNoTracking()
            .Include(r => r.Post)
                .ThenInclude(p => p.User)
            .Include(r => r.Post)
                .ThenInclude(p => p.MediaItems)
            .Include(r => r.Reporter)
            .Include(r => r.ProcessedBy)
            .FirstOrDefaultAsync(r => r.Id == reportId && !r.IsDeleted);
    }

    public async Task<bool> HasReportedAsync(Guid userId, Guid postId)
    {
        return await _context.PostReports
            .AnyAsync(r => r.ReporterId == userId
                        && r.PostId == postId
                        && !r.IsDeleted);
    }
}