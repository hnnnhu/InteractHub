// SocialGraphPlatform.Application/Interfaces/Repositories/IReportRepository.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.Interfaces.Repositories;

public interface IReportRepository : IGenericRepository<PostReport>
{
    Task<PagedResult<PostReport>> GetMyReportsAsync(Guid userId, int pageNumber, int pageSize);

    Task<PagedResult<PostReport>> GetAllReportsAsync(
        int pageNumber,
        int pageSize,
        ReportStatus? status = null,
        ReportReason? reason = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null);

    Task<PostReport?> GetReportWithDetailsAsync(Guid reportId);

    Task<bool> HasReportedAsync(Guid userId, Guid postId);
}