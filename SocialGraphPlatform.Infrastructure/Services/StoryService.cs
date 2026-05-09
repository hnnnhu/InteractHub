using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Story;
using SocialGraphPlatform.Application.DTOs.Stories;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;
using SocialGraphPlatform.Infrastructure.Data; // Thêm để dùng AppDbContext
using Microsoft.EntityFrameworkCore; // Dùng AnyAsync

namespace SocialGraphPlatform.Infrastructure.Services;

public class StoryService : IStoryService
{
    private readonly IStoryRepository _storyRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFriendshipRepository _friendshipRepository;
    private readonly INotificationService _notificationService;
    private readonly AppDbContext _context; // Thêm DbContext

    public StoryService(
        IStoryRepository storyRepository,
        IUserRepository userRepository,
        IFriendshipRepository friendshipRepository,
        INotificationService notificationService,
        AppDbContext context) // Inject DbContext
    {
        _storyRepository = storyRepository;
        _userRepository = userRepository;
        _friendshipRepository = friendshipRepository;
        _notificationService = notificationService;
        _context = context;
    }

    // 1. Tạo Story mới
    public async Task<ApiResponse<IdDto>> CreateStoryAsync(Guid currentUserId, CreateStoryDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Content) && string.IsNullOrWhiteSpace(request.MediaUrl))
            return ApiResponse<IdDto>.BadRequest("Story phải có nội dung hoặc media");

        var story = new Story(
            currentUserId,
            request.MediaUrl,
            request.Type,
            request.Content,
            request.Privacy,
            request.DurationHours);

        await _storyRepository.AddAsync(story);
        await _storyRepository.SaveChangesAsync();

        _ = MentionProcessor.ProcessMentionsAsync(
            request.Content,
            currentUserId,
            $"/stories/{story.Id}",
            story.Id,
            _userRepository,
            _notificationService);

        return ApiResponse<IdDto>.Ok(new IdDto(story.Id), "Đăng Story thành công");
    }

    // 2. Xem chi tiết một Story (có kiểm tra quyền riêng tư)
    public async Task<ApiResponse<StoryResponseDto>> GetStoryByIdAsync(Guid currentUserId, Guid storyId)
    {
        var story = await _storyRepository.GetStoryWithDetailsAsync(storyId);
        if (story == null || !story.IsActive())
            return ApiResponse<StoryResponseDto>.NotFound("Story không tồn tại hoặc đã hết hạn");

        if (story.Privacy == PrivacyLevel.Private && story.UserId != currentUserId)
            return ApiResponse<StoryResponseDto>.Forbidden("Bạn không có quyền xem Story này");

        if (story.Privacy == PrivacyLevel.FriendsOnly && story.UserId != currentUserId)
        {
            var isFriend = await _friendshipRepository.IsFriendAsync(currentUserId, story.UserId);
            if (!isFriend)
                return ApiResponse<StoryResponseDto>.Forbidden("Chỉ bạn bè mới xem được Story này");
        }

        if (story.Privacy == PrivacyLevel.CloseFriends && story.UserId != currentUserId)
        {
            var isCloseFriend = await _friendshipRepository.IsCloseFriendAsync(currentUserId, story.UserId);
            if (!isCloseFriend)
                return ApiResponse<StoryResponseDto>.Forbidden("Chỉ bạn thân mới xem được Story này");
        }

        var dto = MapToStoryResponseDto(story, currentUserId);
        return ApiResponse<StoryResponseDto>.Ok(dto);
    }

    // 3. Xoá Story (chỉ chủ sở hữu)
    public async Task<ApiResponse> DeleteStoryAsync(Guid currentUserId, Guid storyId)
    {
        var story = await _storyRepository.GetByIdAsync(storyId);
        if (story == null)
            return ApiResponse.NotFound("Không tìm thấy Story");

        if (story.UserId != currentUserId)
            return ApiResponse.Forbidden("Bạn không có quyền xóa Story này");

        story.Delete(currentUserId);
        await _storyRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đã xóa Story");
    }

    // 4. Lấy feed story của bạn bè
    public async Task<ApiResponse<List<ActiveStoryDto>>> GetActiveStoriesFeedAsync(Guid currentUserId)
    {
        var stories = await _storyRepository.GetActiveStoriesFeedAsync(currentUserId);

        // Lấy view counts cho các story của chính currentUserId (cần tổng view thực)
        var myStoryIds = stories
            .Where(s => s.UserId == currentUserId)
            .Select(s => s.Id)
            .Distinct()
            .ToList();

        var viewCounts = myStoryIds.Any()
            ? await _storyRepository.GetViewCountsAsync(myStoryIds)
            : new Dictionary<Guid, int>();

        var grouped = stories
            .GroupBy(s => s.UserId)
            .Select(g =>
            {
                var firstStory = g.First();
                return new ActiveStoryDto
                {
                    UserId = g.Key,
                    UserName = firstStory.User.UserName,
                    FullName = firstStory.User.FullName,
                    AvatarUrl = firstStory.User.AvatarUrl,
                    Stories = g.Select(s =>
                    {
                        int? viewCount = null;
                        if (s.UserId == currentUserId)
                            viewCount = viewCounts.GetValueOrDefault(s.Id, 0);
                        return MapToStoryResponseDto(s, currentUserId, viewCount);
                    }).ToList(),
                    LatestStoryCreatedAt = g.Max(s => s.CreatedAt),
                    UnviewedCount = g.Count(s => !s.Views.Any(v => v.ViewerId == currentUserId))
                };
            })
            .OrderByDescending(g => g.LatestStoryCreatedAt)
            .ToList();

        return ApiResponse<List<ActiveStoryDto>>.Ok(grouped);
    }

    // 5. Lấy story của chính mình (My Stories)
    public async Task<ApiResponse<ActiveStoryDto>> GetMyStoriesAsync(Guid userId)
    {
        var stories = await _storyRepository.GetActiveStoriesByUserAsync(userId);

        if (!stories.Any())
        {
            var user = await _userRepository.GetByIdAsync(userId);
            return ApiResponse<ActiveStoryDto>.Ok(new ActiveStoryDto
            {
                UserId = userId,
                UserName = user?.UserName ?? string.Empty,
                FullName = user?.FullName ?? string.Empty,
                AvatarUrl = user?.AvatarUrl,
                Stories = new List<StoryResponseDto>(),
                LatestStoryCreatedAt = DateTimeOffset.UtcNow,
                UnviewedCount = 0
            });
        }

        // Batch query view counts cho tất cả story của user
        var storyIds = stories.Select(s => s.Id).ToList();
        var viewCounts = await _storyRepository.GetViewCountsAsync(storyIds);

        var storyDtos = stories.Select(s =>
        {
            int viewCount = viewCounts.GetValueOrDefault(s.Id, 0);
            return MapToStoryResponseDto(s, userId, viewCount);
        }).ToList();

        var firstStory = stories.First();
        var dto = new ActiveStoryDto
        {
            UserId = userId,
            UserName = firstStory.User.UserName,
            FullName = firstStory.User.FullName,
            AvatarUrl = firstStory.User.AvatarUrl,
            Stories = storyDtos,
            LatestStoryCreatedAt = stories.Max(s => s.CreatedAt),
            UnviewedCount = stories.Count(s => !s.Views.Any())
        };

        return ApiResponse<ActiveStoryDto>.Ok(dto);
    }

    // 6. Đánh dấu story đã xem (SỬA)
    public async Task<ApiResponse> MarkStoryAsViewedAsync(Guid currentUserId, Guid storyId)
    {
        var story = await _storyRepository.GetStoryWithDetailsAsync(storyId);
        if (story == null || !story.IsActive())
            return ApiResponse.NotFound("Story không tồn tại hoặc đã hết hạn");

        if (currentUserId == story.UserId)
            return ApiResponse.Ok("Không tính view của chính chủ");

        // Kiểm tra xem đã xem chưa: query thẳng DB
        var alreadyViewed = await _context.StoryViews
            .AnyAsync(v => v.StoryId == storyId && v.ViewerId == currentUserId);

        if (alreadyViewed)
            return ApiResponse.Ok("Đã xem trước đó");

        // Insert trực tiếp
        var newView = new StoryView
        {
            StoryId = storyId,
            ViewerId = currentUserId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.StoryViews.Add(newView);
        await _context.SaveChangesAsync();

        return ApiResponse.Ok("Đã ghi nhận lượt xem");
    }

    // 7. Lấy danh sách người đã xem Story (chỉ chủ story)
    public async Task<ApiResponse<PagedResult<StoryViewDto>>> GetStoryViewsAsync(
        Guid currentUserId, Guid storyId, int pageNumber = 1, int pageSize = 20)
    {
        var story = await _storyRepository.GetByIdAsync(storyId);
        if (story == null)
            return ApiResponse<PagedResult<StoryViewDto>>.NotFound("Story không tồn tại");

        if (story.UserId != currentUserId)
            return ApiResponse<PagedResult<StoryViewDto>>.Forbidden("Bạn không có quyền xem danh sách lượt xem này");

        var pagedResult = await _storyRepository.GetStoryViewsAsync(storyId, pageNumber, pageSize);

        var dtos = pagedResult.Items.Select(v => new StoryViewDto
        {
            Id = v.Id,
            StoryId = v.StoryId,
            ViewerId = v.ViewerId,
            ViewerDisplayName = v.Viewer?.FullName ?? "Người dùng",
            ViewerAvatarUrl = v.Viewer?.AvatarUrl,
            ViewedAt = v.CreatedAt
        }).ToList();

        var response = new PagedResult<StoryViewDto>(
            dtos,
            pagedResult.PageNumber,
            pagedResult.PageSize,
            pagedResult.TotalCount
        );

        return ApiResponse<PagedResult<StoryViewDto>>.Ok(response, $"Đã tải {dtos.Count} lượt xem");
    }

    // ────────────────────── PRIVATE MAPPER ──────────────────────
    private static StoryResponseDto MapToStoryResponseDto(Story story, Guid currentUserId, int? viewCount = null)
    {
        int? finalViewCount = viewCount ?? (story.UserId == currentUserId ? story.Views.Count : null);

        return new StoryResponseDto
        {
            Id = story.Id,
            UserId = story.UserId,
            UserName = story.User.UserName,
            FullName = story.User.FullName,
            AvatarUrl = story.User.AvatarUrl,
            Content = story.Content,
            MediaUrl = story.MediaUrl,
            Type = story.Type,
            Privacy = story.Privacy,
            ExpiresAt = story.ExpiresAt,
            CreatedAt = story.CreatedAt,
            IsActive = story.IsActive(),
            IsExpired = !story.IsActive(),
            SecondsRemaining = story.IsActive()
                ? (long)(story.ExpiresAt - DateTimeOffset.UtcNow).TotalSeconds
                : 0,
            ViewCount = finalViewCount
        };
    }
}