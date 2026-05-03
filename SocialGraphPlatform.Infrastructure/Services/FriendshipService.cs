using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Friendship;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services
{
    public class FriendshipService : IFriendshipService
    {
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;
        private readonly ILogger<FriendshipService> _logger;

        public FriendshipService(
            IFriendshipRepository friendshipRepository,
            IUserRepository userRepository,
            INotificationService notificationService,
            ILogger<FriendshipService> logger)
        {
            _friendshipRepository = friendshipRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
            _logger = logger;
        }

        #region 1. ACTIONS (Gửi / Chấp nhận / Từ chối / Thu hồi / Hủy kết bạn)

        public async Task<ApiResponse> SendFriendRequestAsync(Guid currentUserId, SendFriendRequestDto request)
        {
            if (currentUserId == request.AddresseeId)
            {
                _logger.LogWarning("User {UserId} attempted to send friend request to themselves", currentUserId);
                return ApiResponse.Fail("Không thể gửi lời mời kết bạn cho chính mình.");
            }

            var addressee = await _userRepository.GetByIdAsync(request.AddresseeId);
            if (addressee == null || addressee.IsDeleted)
            {
                _logger.LogWarning("Addressee {AddresseeId} not found or deleted", request.AddresseeId);
                return ApiResponse.NotFound("Người dùng nhận lời mời không tồn tại hoặc tài khoản đã bị vô hiệu hóa.");
            }

            // Kiểm tra quan hệ hiện có (bao gồm cả bản ghi đã soft‑delete)
            var existing = await _friendshipRepository.GetFriendshipAnyStateAsync(currentUserId, request.AddresseeId);

            if (existing != null && !existing.IsDeleted)
            {
                return existing.Status switch
                {
                    FriendshipStatus.Accepted => ApiResponse.Fail("Hai người đã là bạn bè."),
                    FriendshipStatus.Pending => ApiResponse.Fail("Lời mời kết bạn đã tồn tại."),
                    _ => ApiResponse.Fail("Không thể gửi lời mời do trạng thái không hợp lệ.")
                };
            }

            Friendship friendship;
            if (existing != null && existing.IsDeleted)
            {
                // Khôi phục yêu cầu đã bị xoá mềm
                existing.RenewRequest(currentUserId, request.AddresseeId);
                _friendshipRepository.Update(existing);
                friendship = existing;
            }
            else
            {
                friendship = new Friendship(currentUserId, request.AddresseeId);
                await _friendshipRepository.AddAsync(friendship);
            }

            await _friendshipRepository.SaveChangesAsync();

            // Fire‑and‑forget thông báo
            _ = TrySendFriendRequestNotificationAsync(currentUserId, request.AddresseeId, friendship.Id);

            return ApiResponse.Ok("Đã gửi lời mời kết bạn.");
        }

        public async Task<ApiResponse> AcceptFriendRequestAsync(Guid currentUserId, Guid friendshipId)
        {
            var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
            if (friendship == null || friendship.IsDeleted)
                return ApiResponse.NotFound("Không tìm thấy lời mời kết bạn.");

            if (friendship.AddresseeId != currentUserId)
                return ApiResponse.Forbidden("Bạn không có quyền chấp nhận lời mời này.");

            if (friendship.Status != FriendshipStatus.Pending)
                return ApiResponse.Fail("Lời mời không còn ở trạng thái chờ duyệt.");

            friendship.Accept(currentUserId);
            await _friendshipRepository.SaveChangesAsync();

            _ = TrySendFriendAcceptedNotificationAsync(currentUserId, friendship.RequesterId, friendshipId);

            return ApiResponse.Ok("Đã chấp nhận lời mời kết bạn.");
        }

        public async Task<ApiResponse> RejectFriendRequestAsync(Guid currentUserId, Guid friendshipId)
        {
            var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
            if (friendship == null || friendship.IsDeleted)
                return ApiResponse.NotFound("Không tìm thấy lời mời kết bạn.");

            if (friendship.AddresseeId != currentUserId)
                return ApiResponse.Forbidden("Bạn không có quyền từ chối lời mời này.");

            friendship.Decline(currentUserId);
            await _friendshipRepository.SaveChangesAsync();
            return ApiResponse.Ok("Đã từ chối lời mời kết bạn.");
        }

        public async Task<ApiResponse> CancelFriendRequestAsync(Guid currentUserId, Guid friendshipId)
        {
            var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
            if (friendship == null || friendship.IsDeleted)
                return ApiResponse.NotFound("Không tìm thấy lời mời để thu hồi.");

            if (friendship.RequesterId != currentUserId)
                return ApiResponse.Forbidden("Bạn không có quyền thu hồi lời mời này.");

            friendship.CancelByRequester(currentUserId);
            await _friendshipRepository.SaveChangesAsync();
            return ApiResponse.Ok("Đã thu hồi lời mời kết bạn.");
        }

        public async Task<ApiResponse> UnfriendAsync(Guid currentUserId, Guid friendId)
        {
            var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, friendId);
            if (friendship == null || friendship.Status != FriendshipStatus.Accepted)
                return ApiResponse.Fail("Hai người không phải là bạn bè.");

            friendship.Remove(currentUserId);
            await _friendshipRepository.SaveChangesAsync();
            return ApiResponse.Ok("Đã hủy kết bạn thành công.");
        }

        #endregion

        #region 2. CLOSE FRIEND ACTIONS

        public async Task<ApiResponse> AddCloseFriendAsync(Guid currentUserId, Guid friendId)
        {
            if (currentUserId == friendId)
                return ApiResponse.Fail("Không thể tự thêm mình vào danh sách bạn thân.");

            var user = await _userRepository.GetByIdAsync(friendId);
            if (user == null || user.IsDeleted)
                return ApiResponse.NotFound("Người dùng không tồn tại hoặc đã bị vô hiệu hóa.");

            var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, friendId);
            if (friendship == null || friendship.Status != FriendshipStatus.Accepted)
                return ApiResponse.Fail("Hai người chưa là bạn bè. Không thể thêm vào bạn thân.");

            if (friendship.IsCloseFriend)
                return ApiResponse.Fail("Người này đã có trong danh sách bạn thân.");

            friendship.MarkAsCloseFriend();
            await _friendshipRepository.SaveChangesAsync();

            // Fire-and-forget thông báo (tuỳ chọn)
            _ = TrySendCloseFriendAddedNotificationAsync(currentUserId, friendId);

            return ApiResponse.Ok("Đã thêm vào danh sách bạn thân.");
        }

        public async Task<ApiResponse> RemoveCloseFriendAsync(Guid currentUserId, Guid friendId)
        {
            var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, friendId);
            if (friendship == null || friendship.Status != FriendshipStatus.Accepted)
                return ApiResponse.Fail("Hai người không phải là bạn bè.");

            if (!friendship.IsCloseFriend)
                return ApiResponse.Fail("Người này không có trong danh sách bạn thân.");

            friendship.UnmarkAsCloseFriend();
            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse.Ok("Đã xóa khỏi danh sách bạn thân.");
        }

        public async Task<ApiResponse<PagedResult<UserSummaryDto>>> GetCloseFriendsAsync(
            Guid currentUserId, int pageNumber = 1, int pageSize = 20)
        {
            var result = await _friendshipRepository.GetCloseFriendsAsync(currentUserId, pageNumber, pageSize);
            return ApiResponse<PagedResult<UserSummaryDto>>.Ok(result);
        }

        #endregion

        #region 3. QUERIES

        public async Task<ApiResponse<PagedResult<FriendshipResponseDto>>> GetFriendsAsync(
            Guid userId, int pageNumber = 1, int pageSize = 20)
        {
            var result = await _friendshipRepository.GetFriendsAsync(userId, pageNumber, pageSize);
            return ApiResponse<PagedResult<FriendshipResponseDto>>.Ok(result);
        }

        public async Task<ApiResponse<PagedResult<FriendRequestResponseDto>>> GetPendingRequestsAsync(
            Guid currentUserId, int pageNumber = 1, int pageSize = 20)
        {
            var result = await _friendshipRepository.GetPendingRequestsAsync(currentUserId, pageNumber, pageSize);
            return ApiResponse<PagedResult<FriendRequestResponseDto>>.Ok(result);
        }

        public async Task<ApiResponse<PagedResult<SentFriendRequestResponseDto>>> GetSentRequestsAsync(
            Guid currentUserId, int pageNumber = 1, int pageSize = 20)
        {
            var result = await _friendshipRepository.GetSentRequestsAsync(currentUserId, pageNumber, pageSize);
            return ApiResponse<PagedResult<SentFriendRequestResponseDto>>.Ok(result);
        }

        public async Task<ApiResponse<List<FriendSuggestionDto>>> GetFriendSuggestionsAsync(Guid currentUserId)
        {
            var suggestions = await _friendshipRepository.GetFriendSuggestionsAsync(currentUserId, 10);
            return ApiResponse<List<FriendSuggestionDto>>.Ok(suggestions);
        }

        public async Task<ApiResponse<FriendCountResponseDto>> GetFriendCountAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null || user.IsDeleted)
                return ApiResponse<FriendCountResponseDto>.NotFound("Người dùng không tồn tại.");

            var count = await _friendshipRepository.GetFriendCountAsync(userId);
            return ApiResponse<FriendCountResponseDto>.Ok(new FriendCountResponseDto
            {
                UserId = userId,
                Count = count
            });
        }

        #endregion

        #region 4. NOTIFICATION HELPERS (fire‑and‑forget)

        private async Task TrySendFriendRequestNotificationAsync(Guid senderId, Guid receiverId, Guid friendshipId)
        {
            try
            {
                var sender = await _userRepository.GetByIdAsync(senderId);
                string userName = sender?.FullName ?? "Người dùng";

                var dto = new CreateNotificationDto
                {
                    ReceiverId = receiverId,
                    TriggeredById = senderId,
                    Type = NotificationType.FriendRequest,
                    Content = $"{userName} đã gửi cho bạn một lời mời kết bạn.",
                    TargetUrl = "/friends/requests",
                    RelatedEntityId = friendshipId
                };

                var result = await _notificationService.CreateNotificationAsync(dto);
                if (!result.IsSuccess)
                    _logger.LogWarning("Tạo thông báo FriendRequest thất bại: {Message}", result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi gửi thông báo FriendRequest");
            }
        }

        private async Task TrySendFriendAcceptedNotificationAsync(Guid accepterId, Guid requesterId, Guid friendshipId)
        {
            try
            {
                var accepter = await _userRepository.GetByIdAsync(accepterId);
                string userName = accepter?.FullName ?? "Người dùng";

                var dto = new CreateNotificationDto
                {
                    ReceiverId = requesterId,
                    TriggeredById = accepterId,
                    Type = NotificationType.FriendAccepted,
                    Content = $"{userName} đã chấp nhận lời mời kết bạn.",
                    TargetUrl = $"/profile/{accepterId}",
                    RelatedEntityId = friendshipId
                };

                var result = await _notificationService.CreateNotificationAsync(dto);
                if (!result.IsSuccess)
                    _logger.LogWarning("Tạo thông báo FriendAccepted thất bại: {Message}", result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi gửi thông báo FriendAccepted");
            }
        }

        private async Task TrySendCloseFriendAddedNotificationAsync(Guid senderId, Guid friendId)
        {
            try
            {
                var sender = await _userRepository.GetByIdAsync(senderId);
                string userName = sender?.FullName ?? "Người dùng";

                var dto = new CreateNotificationDto
                {
                    ReceiverId = friendId,
                    TriggeredById = senderId,
                    Type = NotificationType.CloseFriendAdded, // Đảm bảo enum này đã được thêm
                    Content = $"{userName} đã thêm bạn vào danh sách bạn thân.",
                    TargetUrl = $"/profile/{senderId}",
                    RelatedEntityId = senderId
                };

                var result = await _notificationService.CreateNotificationAsync(dto);
                if (!result.IsSuccess)
                    _logger.LogWarning("Tạo thông báo CloseFriendAdded thất bại: {Message}", result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi gửi thông báo CloseFriendAdded");
            }
        }

        #endregion
    }
}