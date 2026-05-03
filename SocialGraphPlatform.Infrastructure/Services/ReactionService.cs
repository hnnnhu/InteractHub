// SocialGraphPlatform.Infrastructure/Services/ReactionService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.DTOs.Reaction;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services;

public class ReactionService : IReactionService
{
    private readonly IReactionRepository _reactionRepository;
    private readonly IPostRepository _postRepository;
    private readonly INotificationService _notificationService;
    private readonly IUserRepository _userRepository;

    public ReactionService(
        IReactionRepository reactionRepository,
        IPostRepository postRepository,
        INotificationService notificationService,
        IUserRepository userRepository)
    {
        _reactionRepository = reactionRepository;
        _postRepository = postRepository;
        _notificationService = notificationService;
        _userRepository = userRepository;
    }

    public async Task<ApiResponse<ReactionCountDto>> AddOrUpdateReactionAsync(Guid currentUserId, AddReactionDto request)
    {
        // Kiểm tra bài viết tồn tại
        if (!await _postRepository.ExistsActiveAsync(request.PostId))
            return ApiResponse<ReactionCountDto>.NotFound("Không tìm thấy bài viết");

        // Thực hiện thao tác thả/gỡ/cập nhật cảm xúc và nhận ngay summary mới nhất
        var summary = await _reactionRepository.AddOrUpdateReactionAsync(currentUserId, request.PostId, request.Type);

        // Chỉ tạo thông báo khi người dùng hiện tại còn đang thả cảm xúc (chưa bị gỡ)
        if (summary.CurrentUserReaction != null)
        {
            // Lấy thông tin chủ bài viết mà không cần include tất cả các quan hệ
            var post = await _postRepository.GetByIdAsync(request.PostId);
            if (post != null && post.UserId != currentUserId)
            {
                var reactor = await _userRepository.GetByIdAsync(currentUserId);
                var reactorName = reactor?.FullName ?? "Ai đó";

                var notificationDto = new CreateNotificationDto
                {
                    ReceiverId = post.UserId,
                    TriggeredById = currentUserId,
                    Type = NotificationType.PostReaction,
                    Content = $"{reactorName} đã thả cảm xúc vào bài viết của bạn.",
                    TargetUrl = $"/posts/{post.Id}",
                    RelatedEntityId = post.Id
                };

                // Gửi thông báo; HasRecentSimilarNotification sẽ tự động chống spam trong 60 giây
                await _notificationService.CreateNotificationAsync(notificationDto);
            }
        }

        return ApiResponse<ReactionCountDto>.Ok(summary, "Cập nhật cảm xúc thành công");
    }

    public async Task<ApiResponse> RemoveReactionAsync(Guid currentUserId, Guid postId)
    {
        if (!await _postRepository.ExistsActiveAsync(postId))
            return ApiResponse.NotFound("Không tìm thấy bài viết");

        await _reactionRepository.RemoveReactionAsync(currentUserId, postId);
        return ApiResponse.Ok("Đã gỡ cảm xúc");
    }

    public async Task<ApiResponse<ReactionCountDto>> GetReactionSummaryAsync(Guid currentUserId, Guid postId)
    {
        if (!await _postRepository.ExistsActiveAsync(postId))
            return ApiResponse<ReactionCountDto>.NotFound("Không tìm thấy bài viết");

        var summary = await _reactionRepository.GetReactionSummaryAsync(postId, currentUserId);
        return ApiResponse<ReactionCountDto>.Ok(summary);
    }

    public async Task<ApiResponse<PagedResult<UserReactionDto>>> GetUsersReactedAsync(
        Guid postId, int pageNumber = 1, int pageSize = 20)
    {
        if (!await _postRepository.ExistsActiveAsync(postId))
            return ApiResponse<PagedResult<UserReactionDto>>.NotFound("Không tìm thấy bài viết");

        var pagedResult = await _reactionRepository.GetUsersReactedAsync(postId, pageNumber, pageSize);
        return ApiResponse<PagedResult<UserReactionDto>>.Ok(pagedResult);
    }
}