// SocialGraphPlatform.Infrastructure/Services/NotificationService.cs

using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationSettingsService _settingsService;   // Interface kiểm tra cài đặt thông báo
    private readonly IUserMuteService _muteService;                 // Interface kiểm tra danh sách mute

    public NotificationService(
        INotificationRepository notificationRepository,
        INotificationSettingsService settingsService,
        IUserMuteService muteService)
    {
        _notificationRepository = notificationRepository;
        _settingsService = settingsService;
        _muteService = muteService;
    }

    // ======================== TRUY VẤN & HIỂN THỊ ========================

    public async Task<ApiResponse<PagedResult<NotificationResponseDto>>> GetNotificationsAsync(
        Guid currentUserId,
        int pageNumber = 1,
        int pageSize = 20,
        NotificationType? typeFilter = null,
        bool? unreadOnly = null)
    {
        var paged = await _notificationRepository.GetNotificationsAsync(
            currentUserId, pageNumber, pageSize, typeFilter, unreadOnly);

        var dtos = paged.Items.Select(MapToDto).ToList();
        var result = new PagedResult<NotificationResponseDto>(dtos, pageNumber, pageSize, paged.TotalCount);
        return ApiResponse<PagedResult<NotificationResponseDto>>.Ok(result);
    }

    public async Task<ApiResponse<NotificationResponseDto>> GetByIdAsync(Guid currentUserId, Guid notificationId)
    {
        var notification = await _notificationRepository.GetByIdAndReceiverAsync(notificationId, currentUserId);
        if (notification == null)
            return ApiResponse<NotificationResponseDto>.Fail("Không tìm thấy thông báo hoặc không có quyền truy cập.");

        var dto = MapToDto(notification);
        return ApiResponse<NotificationResponseDto>.Ok(dto);
    }

    public async Task<ApiResponse<int>> GetUnreadCountAsync(Guid currentUserId)
    {
        var count = await _notificationRepository.GetUnreadCountAsync(currentUserId);
        return ApiResponse<int>.Ok(count);
    }

    // ======================== THAO TÁC TRẠNG THÁI ========================

    public async Task<ApiResponse> MarkAsReadAsync(Guid currentUserId, MarkAsReadDto request)
    {
        await _notificationRepository.MarkAsReadAsync(currentUserId, request.NotificationIds, request.MarkAll);
        return ApiResponse.Ok("Đã đánh dấu thông báo là đã đọc");
    }

    // ======================== TẠO MỚI & CHỐNG SPAM ========================

    public async Task<ApiResponse<NotificationResponseDto?>> CreateNotificationAsync(CreateNotificationDto request)
    {
        // 1. Kiểm tra người nhận không phải người gửi (đã có validate trong DTO, nhưng phòng thủ)
        if (request.ReceiverId == request.TriggeredById)
            return ApiResponse<NotificationResponseDto?>.Ok(null, "Không tạo thông báo cho chính mình.");

        // 2. Kiểm tra cài đặt thông báo của người nhận (trừ khi BypassUserSettings = true)
        if (!request.BypassUserSettings)
        {
            var canSend = await _settingsService.CanSendNotificationAsync(request.ReceiverId, request.Type);
            if (!canSend)
                return ApiResponse<NotificationResponseDto?>.Ok(null, "Người dùng đã tắt loại thông báo này.");
        }

        // 3. Kiểm tra danh sách mute (nếu TriggeredById không null)
        if (request.TriggeredById.HasValue)
        {
            var isMuted = await _muteService.IsMutedAsync(request.ReceiverId, request.TriggeredById.Value);
            if (isMuted)
                return ApiResponse<NotificationResponseDto?>.Ok(null, "Người dùng đã mute người gửi.");
        }

        // 4. Chống spam: kiểm tra thông báo tương tự trong vòng 60 giây (có thể cấu hình)
        var hasRecent = await _notificationRepository.HasRecentSimilarNotificationAsync(
            request.ReceiverId,
            request.TriggeredById,
            request.Type,
            request.RelatedEntityId,
            withinSeconds: 60);

        if (hasRecent)
            return ApiResponse<NotificationResponseDto?>.Ok(null, "Đã có thông báo tương tự gần đây.");

        // 5. Gộp nhóm (grouping) – chỉ áp dụng với một số loại (PostReaction, PostComment, StoryReaction...)
        bool shouldGroup = request.Type is NotificationType.PostReaction
                            or NotificationType.PostComment
                            or NotificationType.StoryReaction;

        if (shouldGroup && request.RelatedEntityId.HasValue)
        {
            var groupableNoti = await _notificationRepository.GetUnreadGroupableNotificationAsync(
                request.ReceiverId, request.Type, request.RelatedEntityId.Value);

            if (groupableNoti != null)
            {
                // Cập nhật nội dung gộp: thay đổi content, tăng groupedCount (lưu vào content hoặc dùng field riêng)
                // Ở đây ta cập nhật content, ví dụ: "A, B và 3 người khác đã thích bài viết của bạn"
                // Logic tính toán content mới tùy thuộc vào UI/UX, đây chỉ là minh họa
                var currentGroupCount = ExtractGroupCount(groupableNoti.Content); // Hàm tự viết
                var newCount = currentGroupCount + 1;
                var newContent = UpdateGroupContent(request.Content, newCount); // Tạo nội dung mới
                await _notificationRepository.UpdateNotificationContentAsync(
                    groupableNoti.Id, newContent, request.TargetUrl);

                // Trả về thông báo đã được cập nhật (có thể trả về DTO mới)
                var updatedNoti = await _notificationRepository.GetByIdAndReceiverAsync(groupableNoti.Id, request.ReceiverId);
                var dto = MapToDto(updatedNoti!);
                dto.GroupedCount = newCount;  // Gán số lượng
                return ApiResponse<NotificationResponseDto?>.Ok(dto, "Đã gộp với thông báo trước đó.");
            }
        }

        // 6. Tạo thông báo mới
        var entity = new Notification(
            request.ReceiverId,
            request.TriggeredById,
            request.Type,
            request.Content,
            request.TargetUrl,
            request.RelatedEntityId);

        await _notificationRepository.AddNotificationAsync(entity);

        // 7. Sau khi tạo, lấy lại entity đầy đủ (nếu cần Include TriggeredBy)
        var created = await _notificationRepository.GetByIdAndReceiverAsync(entity.Id, request.ReceiverId);
        var resultDto = MapToDto(created!);
        return ApiResponse<NotificationResponseDto?>.Ok(resultDto);
    }

    public async Task<ApiResponse> BulkCreateNotificationsAsync(IEnumerable<CreateNotificationDto> requests)
    {
        // Với mỗi request, thực hiện logic tương tự CreateNotificationAsync nhưng hàng loạt.
        // Để đơn giản, ta lọc qua từng request và dùng AddNotificationAsync (hoặc bulk sau khi đã kiểm tra).
        var validEntities = new List<Notification>();

        foreach (var req in requests)
        {
            if (req.ReceiverId == req.TriggeredById) continue;
            if (!req.BypassUserSettings)
            {
                var canSend = await _settingsService.CanSendNotificationAsync(req.ReceiverId, req.Type);
                if (!canSend) continue;
            }
            if (req.TriggeredById.HasValue)
            {
                var isMuted = await _muteService.IsMutedAsync(req.ReceiverId, req.TriggeredById.Value);
                if (isMuted) continue;
            }
            var hasRecent = await _notificationRepository.HasRecentSimilarNotificationAsync(
                req.ReceiverId, req.TriggeredById, req.Type, req.RelatedEntityId);
            if (hasRecent) continue;

            // Bỏ qua grouping trong bulk cho đơn giản, hoặc có thể xử lý tương tự
            validEntities.Add(new Notification(
                req.ReceiverId, req.TriggeredById, req.Type, req.Content, req.TargetUrl, req.RelatedEntityId));
        }

        if (validEntities.Any())
            await _notificationRepository.BulkAddNotificationsAsync(validEntities);

        return ApiResponse.Ok($"Đã tạo {validEntities.Count} thông báo.");
    }

    // ======================== DỌN DẸP ========================

    public async Task<ApiResponse<int>> DeleteOldNotificationsAsync(Guid currentUserId, int olderThanDays)
    {
        var deletedCount = await _notificationRepository.DeleteOldNotificationsAsync(currentUserId, olderThanDays);
        return ApiResponse<int>.Ok(deletedCount, $"Đã xóa {deletedCount} thông báo cũ.");
    }

    // ====================== MAPPING ======================

    private static NotificationResponseDto MapToDto(Notification n)
    {
        return new NotificationResponseDto
        {
            Id = n.Id,
            TriggeredById = n.TriggeredById,
            TriggeredByUserName = n.TriggeredBy?.UserName,
            TriggeredByFullName = n.TriggeredBy?.FullName,
            TriggeredByAvatarUrl = n.TriggeredBy?.AvatarUrl,
            Type = n.Type,
            Content = n.Content,
            TargetUrl = n.TargetUrl,
            RelatedEntityId = n.RelatedEntityId,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            ReadAt = n.UpdatedAt,
            TimeAgo = GetTimeAgo(n.CreatedAt),
            GroupedCount = 1 // Mặc định chưa gộp
        };
    }

    private static string GetTimeAgo(DateTimeOffset dateTime)
    {
        var ts = DateTimeOffset.UtcNow - dateTime;
        if (ts.TotalMinutes < 1) return "Vừa xong";
        if (ts.TotalHours < 1) return $"{(int)ts.TotalMinutes} phút trước";
        if (ts.TotalDays < 1) return $"{(int)ts.TotalHours} giờ trước";
        return $"{(int)ts.TotalDays} ngày trước";
    }

    // ====================== HELPERS (dành cho gộp nhóm) ======================

    /// <summary>
    /// Trích xuất số lượng người đã được gộp từ nội dung hiện tại.
    /// Ví dụ: "A và 2 người khác đã like..." -> trả về 2.
    /// </summary>
    private static int ExtractGroupCount(string content)
    {
        // Đây là logic mẫu, có thể dùng regex hoặc lưu riêng một field trong Entity.
        // Tạm thời mặc định 1 nếu không parse được.
        return 1;
    }

    /// <summary>
    /// Tạo nội dung gộp mới từ nội dung gốc của người vừa kích hoạt và tổng số người.
    /// Ví dụ: request.Content = "Nguyễn Văn B đã thích bài viết của bạn"
    /// Khi đã có 3 người -> "Nguyễn Văn B và 2 người khác đã thích bài viết của bạn"
    /// </summary>
    private static string UpdateGroupContent(string originalContent, int totalCount)
    {
        // Logic thực tế sẽ phức tạp hơn, đây chỉ là placeholder.
        return $"{originalContent} và {totalCount - 1} người khác";
    }
}