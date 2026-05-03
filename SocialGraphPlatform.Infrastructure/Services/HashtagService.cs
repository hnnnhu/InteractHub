// SocialGraphPlatform.Infrastructure/Services/HashtagService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Hashtag;
using SocialGraphPlatform.Application.DTOs.Post;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Services;

public class HashtagService : IHashtagService
{
    private readonly IHashtagRepository _hashtagRepository;

    public HashtagService(IHashtagRepository hashtagRepository)
    {
        _hashtagRepository = hashtagRepository;
    }

    public async Task<ApiResponse<PagedResult<HashtagDto>>> SearchHashtagsAsync(HashtagSearchDto request)
    {
        var pagedHashtags = await _hashtagRepository.SearchHashtagsAsync(request);

        var dtos = pagedHashtags.Items.Select(h => new HashtagDto
        {
            Id = h.Id,
            Name = h.Name,
            UsageCount = h.UsageCount,
            CreatedAt = h.CreatedAt
        }).ToList();

        var result = new PagedResult<HashtagDto>(dtos, request.PageNumber, request.PageSize, pagedHashtags.TotalCount);
        return ApiResponse<PagedResult<HashtagDto>>.Ok(result);
    }

    public async Task<ApiResponse<List<TrendingHashtagDto>>> GetTrendingHashtagsAsync(int count = 10)
    {
        var now = DateTimeOffset.UtcNow;
        var sevenDaysAgo = now.AddDays(-7);
        var fourteenDaysAgo = now.AddDays(-14);

        var currentData = await _hashtagRepository.GetTrendingHashtagsByDateAsync(count, sevenDaysAgo);
        var previousData = await _hashtagRepository.GetTrendingHashtagsByDateAsync(count * 2, fourteenDaysAgo, sevenDaysAgo);
        var previousDict = previousData.ToDictionary(x => x.Name, x => x.Count);

        var dtos = currentData.Select((h, index) =>
        {
            double calculatedChange = 0;
            if (previousDict.TryGetValue(h.Name, out int prevCount) && prevCount > 0)
            {
                calculatedChange = ((double)(h.Count - prevCount) / prevCount) * 100;
            }
            else
            {
                calculatedChange = 100.0;
            }

            return new TrendingHashtagDto
            {
                Name = h.Name,
                UsageCount = h.Count,
                Rank = index + 1,
                // Ép kiểu an toàn sang int?
                ChangePercent = (int)Math.Round(calculatedChange)
            };
        }).ToList();

        return ApiResponse<List<TrendingHashtagDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<HashtagWithPostsDto>> GetHashtagWithPostsAsync(
        Guid currentUserId, string name, int pageNumber, int pageSize)
    {
        var hashtag = await _hashtagRepository.GetHashtagWithPostsAsync(name, pageNumber, pageSize);
        if (hashtag == null)
            return ApiResponse<HashtagWithPostsDto>.NotFound($"Không tìm thấy hashtag #{name}");

        var postDtos = hashtag.PostHashtags?
            .Select(ph => ph.Post)
            .Where(p => p != null && !p.IsDeleted)
            .Select(p => new PostSummaryDto
            {
                Id = p.Id,
                UserId = p.UserId,
                UserName = p.User?.UserName ?? string.Empty,
                FullName = p.User?.FullName ?? string.Empty,
                AvatarUrl = p.User?.AvatarUrl,
                Content = p.Content?.Length > 150 ? p.Content.Substring(0, 150) + "..." : p.Content,
                CreatedAt = p.CreatedAt,
                FirstMediaUrl = p.MediaItems?.OrderBy(m => m.SortOrder).FirstOrDefault()?.MediaUrl,
                MediaCount = p.MediaItems?.Count ?? 0,
                LikeCount = p.Reactions?.Count ?? 0,
                CommentCount = p.Comments?.Count ?? 0,
                IsLikedByCurrentUser = p.Reactions?.Any(r => r.UserId == currentUserId) ?? false,
                IsSavedByCurrentUser = p.SavedByUsers?.Any(s => s.UserId == currentUserId) ?? false
            }).ToList() ?? new List<PostSummaryDto>();

        return ApiResponse<HashtagWithPostsDto>.Ok(new HashtagWithPostsDto
        {
            Name = hashtag.Name,
            UsageCount = hashtag.UsageCount,
            Posts = postDtos
        });
    }

    // ========================================================
    // ĐÃ FIX: Sử dụng hàm Remove(entity) từ IGenericRepository
    // ========================================================
    public async Task<ApiResponse> DeleteHashtagAsync(string name)
    {
        var hashtag = await _hashtagRepository.GetByNameAsync(name);
        if (hashtag == null)
            return ApiResponse.NotFound("Không tìm thấy hashtag.");

        // Ràng buộc: Hashtag phải không còn ai dùng mới được xóa
        if (hashtag.UsageCount > 0)
            return ApiResponse.BadRequest("Không thể xóa hashtag đang có bài viết sử dụng.");

        // 1. Đánh dấu xóa trong ChangeTracker (Hàm Remove là đồng bộ)
        _hashtagRepository.Remove(hashtag);

        // 2. Thực thi lệnh DELETE xuống SQL Server
        await _hashtagRepository.SaveChangesAsync();

        return ApiResponse.Ok("Xóa hashtag thành công.");
    }
}