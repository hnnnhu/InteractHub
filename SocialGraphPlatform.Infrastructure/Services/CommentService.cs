// SocialGraphPlatform.Infrastructure/Services/CommentService.cs

using SocialGraphPlatform.Application.DTOs.Comment;
using SocialGraphPlatform.Application.DTOs.Comments;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly INotificationService _notificationService;
    private readonly IUserRepository _userRepository;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        INotificationService notificationService,
        IUserRepository userRepository)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _notificationService = notificationService;
        _userRepository = userRepository;
    }

    public async Task<ApiResponse<IdDto>> CreateCommentAsync(Guid currentUserId, CreateCommentDto request)
    {
        if (!await _postRepository.ExistsActiveAsync(request.PostId))
            return ApiResponse<IdDto>.NotFound("Bài viết không tồn tại");

        var comment = new Comment(request.PostId, currentUserId, request.Content, request.ParentCommentId);

        await _commentRepository.AddAsync(comment);
        await _commentRepository.SaveChangesAsync();

        // ================ GỬI THÔNG BÁO ================
        try
        {
            var user = await _userRepository.GetByIdAsync(currentUserId);
            var userName = user?.FullName ?? "Ai đó";

            // 1. Thông báo cho chủ bài viết
            var post = await _postRepository.GetPostWithDetailsAsync(request.PostId);
            if (post != null && post.UserId != currentUserId)
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    ReceiverId = post.UserId,
                    TriggeredById = currentUserId,
                    Type = NotificationType.PostComment,
                    Content = $"{userName} đã bình luận về bài viết của bạn.",
                    TargetUrl = $"/posts/{post.Id}#comment-{comment.Id}",
                    RelatedEntityId = post.Id
                });
            }

            // 2. Nếu là reply → thông báo cho chủ comment cha
            if (request.ParentCommentId.HasValue)
            {
                var parentComment = await _commentRepository.GetByIdAsync(request.ParentCommentId.Value);
                if (parentComment != null && parentComment.UserId != currentUserId)
                {
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                    {
                        ReceiverId = parentComment.UserId,
                        TriggeredById = currentUserId,
                        Type = NotificationType.PostComment,
                        Content = $"{userName} đã trả lời bình luận của bạn.",
                        TargetUrl = $"/posts/{post?.Id}#comment-{parentComment.Id}",
                        RelatedEntityId = post?.Id
                    });
                }
            }
        }
        catch
        {
            // Fire-and-forget: không ảnh hưởng đến luồng chính nếu gửi thông báo thất bại
        }

        // ================ XỬ LÝ MENTION ================
        // Fire-and-forget
        _ = MentionProcessor.ProcessMentionsAsync(
            request.Content,
            currentUserId,
            $"/posts/{request.PostId}#comment-{comment.Id}",
            comment.Id,
            _userRepository,
            _notificationService);

        return ApiResponse<IdDto>.Ok(new IdDto(comment.Id), "Đăng bình luận thành công");
    }

    public async Task<ApiResponse> UpdateCommentAsync(Guid currentUserId, Guid commentId, UpdateCommentDto request)
    {
        if (!await _commentRepository.IsOwnerAsync(commentId, currentUserId))
            return ApiResponse.Forbidden("Bạn không có quyền chỉnh sửa bình luận này");

        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
            return ApiResponse.NotFound("Không tìm thấy bình luận");

        comment.UpdateContent(request.Content, currentUserId);
        await _commentRepository.SaveChangesAsync();

        return ApiResponse.Ok("Cập nhật bình luận thành công");
    }

    public async Task<ApiResponse> DeleteCommentAsync(Guid currentUserId, Guid commentId)
    {
        if (!await _commentRepository.IsOwnerAsync(commentId, currentUserId))
            return ApiResponse.Forbidden("Bạn không có quyền xóa bình luận này");

        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
            return ApiResponse.NotFound("Không tìm thấy bình luận");

        comment.SoftDelete(currentUserId);
        await _commentRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đã xóa bình luận");
    }

    // ======================================================
    // GET COMMENTS & REPLIES
    // ======================================================

    public async Task<ApiResponse<PagedResult<CommentResponseDto>>> GetCommentsByPostIdAsync(
        Guid currentUserId, Guid postId, int pageNumber, int pageSize)
    {
        if (!await _postRepository.ExistsActiveAsync(postId))
            return ApiResponse<PagedResult<CommentResponseDto>>.NotFound("Bài viết không tồn tại");

        var pagedComments = await _commentRepository.GetCommentsByPostIdAsync(postId, pageNumber, pageSize);

        var rootCommentIds = pagedComments.Items.Select(c => c.Id).ToList();
        var childCommentIds = pagedComments.Items
            .Where(c => c.Replies != null)
            .SelectMany(c => c.Replies!)
            .Select(r => r.Id)
            .ToList();

        var allIdsToCount = rootCommentIds.Concat(childCommentIds).ToList();

        var replyCountsMap = await _commentRepository.GetReplyCountsAsync(allIdsToCount);

        var dtos = pagedComments.Items.Select(c => MapToDto(c, replyCountsMap)).ToList();

        var result = new PagedResult<CommentResponseDto>(dtos, pageNumber, pageSize, pagedComments.TotalCount);
        return ApiResponse<PagedResult<CommentResponseDto>>.Ok(result);
    }

    private CommentResponseDto MapToDto(Comment comment, Dictionary<Guid, int> replyCountsMap)
    {
        return new CommentResponseDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            UserId = comment.UserId,
            UserName = comment.User?.UserName ?? string.Empty,
            FullName = comment.User?.FullName ?? string.Empty,
            AvatarUrl = comment.User?.AvatarUrl,
            Content = comment.Content,
            ParentCommentId = comment.ParentCommentId,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,

            ReplyCount = replyCountsMap.TryGetValue(comment.Id, out int count) ? count : 0,

            Replies = comment.Replies?.Select(r => MapToDto(r, replyCountsMap)).ToList()
                      ?? new List<CommentResponseDto>()
        };
    }

    public async Task<ApiResponse<PagedResult<CommentReplyDto>>> GetRepliesAsync(
        Guid currentUserId, Guid parentCommentId, int pageNumber, int pageSize)
    {
        var pagedReplies = await _commentRepository.GetRepliesAsync(parentCommentId, pageNumber, pageSize);

        var commentIds = pagedReplies.Items.Select(c => c.Id).ToList();
        var replyCountsMap = await _commentRepository.GetReplyCountsAsync(commentIds);

        var dtos = pagedReplies.Items.Select(c => new CommentReplyDto
        {
            Id = c.Id,
            PostId = c.PostId,
            ParentCommentId = c.ParentCommentId ?? Guid.Empty,
            UserId = c.UserId,
            UserName = c.User?.UserName ?? string.Empty,
            FullName = c.User?.FullName ?? string.Empty,
            AvatarUrl = c.User?.AvatarUrl,
            Content = c.Content,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,

            ReplyCount = replyCountsMap.TryGetValue(c.Id, out int count) ? count : 0,

            Replies = new List<CommentReplyDto>()
        }).ToList();

        var result = new PagedResult<CommentReplyDto>(dtos, pageNumber, pageSize, pagedReplies.TotalCount);
        return ApiResponse<PagedResult<CommentReplyDto>>.Ok(result);
    }
}