// SocialGraphPlatform.Application/Interfaces/IFriendshipService.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Friendship;
using SocialGraphPlatform.Application.DTOs.User; // Thêm để dùng UserSummaryDto

namespace SocialGraphPlatform.Application.Interfaces
{
    public interface IFriendshipService
    {
        // --- THAO TÁC LỜI MỜI (ACTIONS) ---

        Task<ApiResponse> SendFriendRequestAsync(Guid currentUserId, SendFriendRequestDto request);
        Task<ApiResponse> AcceptFriendRequestAsync(Guid currentUserId, Guid friendshipId);
        Task<ApiResponse> RejectFriendRequestAsync(Guid currentUserId, Guid friendshipId);
        Task<ApiResponse> UnfriendAsync(Guid currentUserId, Guid friendId);
        Task<ApiResponse> CancelFriendRequestAsync(Guid currentUserId, Guid friendshipId);

        // --- CLOSE FRIEND ACTIONS ---

        /// <summary>
        /// Thêm một người bạn vào danh sách bạn thân.
        /// </summary>
        Task<ApiResponse> AddCloseFriendAsync(Guid currentUserId, Guid friendId);

        /// <summary>
        /// Xóa một người bạn khỏi danh sách bạn thân.
        /// </summary>
        Task<ApiResponse> RemoveCloseFriendAsync(Guid currentUserId, Guid friendId);

        // --- TRUY VẤN (QUERIES) ---

        Task<ApiResponse<PagedResult<FriendshipResponseDto>>> GetFriendsAsync(Guid userId, int pageNumber, int pageSize);
        Task<ApiResponse<PagedResult<FriendRequestResponseDto>>> GetPendingRequestsAsync(Guid currentUserId, int pageNumber, int pageSize);
        Task<ApiResponse<PagedResult<SentFriendRequestResponseDto>>> GetSentRequestsAsync(Guid currentUserId, int pageNumber, int pageSize);
        Task<ApiResponse<List<FriendSuggestionDto>>> GetFriendSuggestionsAsync(Guid currentUserId);
        Task<ApiResponse<FriendCountResponseDto>> GetFriendCountAsync(Guid userId);

        /// <summary>
        /// Lấy danh sách bạn thân của người dùng hiện tại, có phân trang.
        /// </summary>
        Task<ApiResponse<PagedResult<UserSummaryDto>>> GetCloseFriendsAsync(Guid currentUserId, int pageNumber, int pageSize);
    }
}