// SocialGraphPlatform.Infrastructure/Services/PostService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Post;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IHashtagRepository _hashtagRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;

    public PostService(
        IPostRepository postRepository,
        IHashtagRepository hashtagRepository,
        IUserRepository userRepository,
        INotificationService notificationService)
    {
        _postRepository = postRepository;
        _hashtagRepository = hashtagRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
    }

    public async Task<ApiResponse<IdDto>> CreatePostAsync(Guid currentUserId, CreatePostDto request)
    {
        var post = new Post(currentUserId, request.Content, request.Privacy);

        // 1. Thêm Media
        if (request.MediaUrls?.Any() == true)
        {
            for (int i = 0; i < request.MediaUrls.Count; i++)
            {
                var media = new PostMedia(post.Id, request.MediaUrls[i], MediaType.Image, i, currentUserId);
                post.MediaItems.Add(media);
            }
        }

        // 2. Xử lý Hashtags
        if (request.Hashtags?.Any() == true)
        {
            var uniqueTags = request.Hashtags
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.TrimStart('#').Trim().ToLower())
                .Distinct()
                .ToList();

            foreach (var tagName in uniqueTags)
            {
                var existingHashtag = await _hashtagRepository.GetByNameAsync(tagName);

                if (existingHashtag == null)
                {
                    existingHashtag = new Hashtag(tagName, currentUserId);
                    await _hashtagRepository.AddAsync(existingHashtag);
                }
                else
                {
                    await _hashtagRepository.IncrementUsageAsync(tagName);
                }

                var postHashtag = new PostHashtag(post.Id, existingHashtag.Id);
                post.PostHashtags.Add(postHashtag);
            }
        }

        // 3. Lưu tất cả vào Database
        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        // 4. Xử lý mention (@username) – fire-and-forget
        //    MentionProcessor đã sửa regex để hỗ trợ dấu chấm & Unicode
        _ = MentionProcessor.ProcessMentionsAsync(
            request.Content,
            currentUserId,
            $"/posts/{post.Id}",
            post.Id,
            _userRepository,
            _notificationService);

        return ApiResponse<IdDto>.Ok(new IdDto(post.Id), "Tạo bài viết thành công");
    }

    public async Task<ApiResponse> UpdatePostAsync(Guid currentUserId, UpdatePostDto request)
    {
        var post = await _postRepository.GetByIdAsync(request.PostId);
        if (post == null)
            return ApiResponse.NotFound("Không tìm thấy bài viết");

        if (post.UserId != currentUserId)
            return ApiResponse.Forbidden("Bạn không có quyền chỉnh sửa bài viết này");

        post.UpdateContent(request.Content, request.Privacy, currentUserId);
        await _postRepository.SaveChangesAsync();

        // Xử lý mention mới sau khi cập nhật nội dung (fire-and-forget)
        _ = MentionProcessor.ProcessMentionsAsync(
            request.Content,
            currentUserId,
            $"/posts/{request.PostId}",
            request.PostId,
            _userRepository,
            _notificationService);

        return ApiResponse.Ok("Cập nhật bài viết thành công");
    }

    public async Task<ApiResponse> DeletePostAsync(Guid currentUserId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
            return ApiResponse.NotFound("Không tìm thấy bài viết");

        if (post.UserId != currentUserId)
            return ApiResponse.Forbidden("Bạn không có quyền xóa bài viết này");

        // Lấy chi tiết bài viết (bao gồm các Hashtag liên quan)
        var postDetails = await _postRepository.GetPostWithDetailsAsync(postId);
        if (postDetails?.PostHashtags?.Any() == true)
        {
            foreach (var postHashtag in postDetails.PostHashtags)
            {
                if (postHashtag.Hashtag != null)
                {
                    var trackedHashtag = await _hashtagRepository.GetByNameAsync(postHashtag.Hashtag.Name);
                    if (trackedHashtag != null)
                    {
                        trackedHashtag.DecrementUsage();
                    }
                }
            }
        }

        // Xóa mềm bài viết (IsDeleted = true)
        post.SoftDelete(currentUserId);

        // Các bản ghi PostHashtag vẫn được giữ lại trong DB để lưu lịch sử.
        // Khi query hashtag, điều kiện `!ph.Post.IsDeleted` đã chặn chúng lại nên không gây lỗi.
        await _postRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đã xóa bài viết thành công");
    }

    public async Task<ApiResponse<PostResponseDto>> GetPostByIdAsync(Guid currentUserId, Guid postId)
    {
        var post = await _postRepository.GetPostWithDetailsAsync(postId);
        if (post == null)
            return ApiResponse<PostResponseDto>.NotFound("Không tìm thấy bài viết");

        if (!await _postRepository.CanUserViewPostAsync(postId, currentUserId))
            return ApiResponse<PostResponseDto>.Forbidden("Bạn không có quyền xem bài viết này");

        var dto = MapToPostResponseDto(post, currentUserId);
        return ApiResponse<PostResponseDto>.Ok(dto);
    }

    public async Task<ApiResponse<PagedResult<PostSummaryDto>>> GetNewsFeedAsync(
        Guid currentUserId,
        int pageNumber = 1,
        int pageSize = 10)
    {
        var pagedPosts = await _postRepository.GetNewsFeedAsync(currentUserId, pageNumber, pageSize);

        var dtos = pagedPosts.Items.Select(p => new PostSummaryDto
        {
            Id = p.Id,
            UserId = p.UserId,
            UserName = p.User?.UserName ?? string.Empty,
            FullName = p.User?.FullName ?? string.Empty,
            AvatarUrl = p.User?.AvatarUrl,
            Content = p.Content?.Length > 150 ? p.Content[..150] + "..." : p.Content,
            Privacy = p.Privacy,
            CreatedAt = p.CreatedAt,
            FirstMediaUrl = p.MediaItems?.OrderBy(m => m.SortOrder).FirstOrDefault()?.MediaUrl,
            MediaCount = p.MediaItems?.Count ?? 0,
            LikeCount = p.Reactions?.Count ?? 0,
            CommentCount = p.Comments?.Count ?? 0,
            IsLikedByCurrentUser = p.Reactions?.Any(r => r.UserId == currentUserId) ?? false,
            IsSavedByCurrentUser = p.SavedByUsers?.Any(s => s.UserId == currentUserId) ?? false
        }).ToList();

        var result = new PagedResult<PostSummaryDto>(dtos, pageNumber, pageSize, pagedPosts.TotalCount);
        return ApiResponse<PagedResult<PostSummaryDto>>.Ok(result);
    }

    public async Task<ApiResponse<PagedResult<PostSummaryDto>>> GetUserPostsAsync(
        Guid currentUserId,
        Guid targetUserId,
        int pageNumber = 1,
        int pageSize = 10)
    {
        var pagedPosts = await _postRepository.GetUserPostsAsync(targetUserId, pageNumber, pageSize);

        var dtos = pagedPosts.Items.Select(p => new PostSummaryDto
        {
            Id = p.Id,
            UserId = p.UserId,
            UserName = p.User?.UserName ?? string.Empty,
            FullName = p.User?.FullName ?? string.Empty,
            AvatarUrl = p.User?.AvatarUrl,
            Content = p.Content?.Length > 150 ? p.Content[..150] + "..." : p.Content,
            Privacy = p.Privacy,
            CreatedAt = p.CreatedAt,
            FirstMediaUrl = p.MediaItems?.OrderBy(m => m.SortOrder).FirstOrDefault()?.MediaUrl,
            MediaCount = p.MediaItems?.Count ?? 0,
            LikeCount = p.Reactions?.Count ?? 0,
            CommentCount = p.Comments?.Count ?? 0,
            IsLikedByCurrentUser = p.Reactions?.Any(r => r.UserId == currentUserId) ?? false,
            IsSavedByCurrentUser = p.SavedByUsers?.Any(s => s.UserId == currentUserId) ?? false
        }).ToList();

        var result = new PagedResult<PostSummaryDto>(dtos, pageNumber, pageSize, pagedPosts.TotalCount);
        return ApiResponse<PagedResult<PostSummaryDto>>.Ok(result);
    }

    // Reaction tạm thời
    public async Task<ApiResponse> AddOrUpdateReactionAsync(Guid currentUserId, Guid postId, int reactionType)
    {
        return ApiResponse.Ok("Reaction đã được cập nhật (logic chi tiết nằm ở ReactionService)");
    }

    public async Task<ApiResponse> RemoveReactionAsync(Guid currentUserId, Guid postId)
    {
        return ApiResponse.Ok("Đã gỡ reaction");
    }

    // ====================== MAPPING ======================
    private static PostResponseDto MapToPostResponseDto(Post post, Guid currentUserId)
    {
        return new PostResponseDto
        {
            Id = post.Id,
            UserId = post.UserId,
            UserName = post.User?.UserName ?? string.Empty,
            FullName = post.User?.FullName ?? string.Empty,
            AvatarUrl = post.User?.AvatarUrl,
            Content = post.Content,
            Privacy = post.Privacy,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            MediaItems = post.MediaItems?
                .OrderBy(m => m.SortOrder)
                .Select(m => new PostMediaDto
                {
                    Id = m.Id,
                    MediaUrl = m.MediaUrl,
                    Type = m.Type,
                    SortOrder = m.SortOrder
                }).ToList() ?? new List<PostMediaDto>(),
            LikeCount = post.Reactions?.Count ?? 0,
            CommentCount = post.Comments?.Count ?? 0,
            IsLikedByCurrentUser = post.Reactions?.Any(r => r.UserId == currentUserId) ?? false,
            IsSavedByCurrentUser = post.SavedByUsers?.Any(s => s.UserId == currentUserId) ?? false,
            Hashtags = post.PostHashtags?.Select(ph => ph.Hashtag.Name).ToList() ?? new List<string>()
        };
    }

    // =======================================================
    // TÌM KIẾM BÀI VIẾT
    // =======================================================
    public async Task<ApiResponse<PagedResult<PostSummaryDto>>> SearchPostsAsync(
        Guid currentUserId,
        string keyword,
        int pageNumber,
        int pageSize)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return await GetNewsFeedAsync(currentUserId, pageNumber, pageSize);

        var pagedPosts = await _postRepository.SearchPostsByKeywordAsync(currentUserId, keyword, pageNumber, pageSize);

        var dtos = pagedPosts.Items.Select(p => new PostSummaryDto
        {
            Id = p.Id,
            UserId = p.UserId,
            UserName = p.User?.UserName ?? string.Empty,
            FullName = p.User?.FullName ?? string.Empty,
            AvatarUrl = p.User?.AvatarUrl,
            Content = p.Content?.Length > 150 ? p.Content[..150] + "..." : p.Content,
            Privacy = p.Privacy,
            CreatedAt = p.CreatedAt,
            FirstMediaUrl = p.MediaItems?.OrderBy(m => m.SortOrder).FirstOrDefault()?.MediaUrl,
            MediaCount = p.MediaItems?.Count ?? 0,
            LikeCount = p.Reactions?.Count ?? 0,
            CommentCount = p.Comments?.Count ?? 0,
            IsLikedByCurrentUser = p.Reactions?.Any(r => r.UserId == currentUserId) ?? false,
            IsSavedByCurrentUser = p.SavedByUsers?.Any(s => s.UserId == currentUserId) ?? false,
            Hashtags = p.PostHashtags?.Select(ph => ph.Hashtag.Name).ToList() ?? new List<string>()
        }).ToList();

        var result = new PagedResult<PostSummaryDto>(dtos, pageNumber, pageSize, pagedPosts.TotalCount);
        return ApiResponse<PagedResult<PostSummaryDto>>.Ok(result);
    }
}