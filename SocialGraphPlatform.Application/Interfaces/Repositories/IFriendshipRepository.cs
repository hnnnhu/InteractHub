// SocialGraphPlatform.Application/Interfaces/Repositories/IFriendshipRepository.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Friendship;
using SocialGraphPlatform.Application.DTOs.User; // thêm để dùng UserSummaryDto
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Interfaces.Repositories
{
    public interface IFriendshipRepository : IGenericRepository<Friendship>
    {
        /// <summary>
        /// Lấy thông tin quan hệ ĐANG ACTIVE (!IsDeleted) giữa 2 người dùng.
        /// </summary>
        Task<Friendship?> GetFriendshipAsync(Guid userId1, Guid userId2);

        /// <summary>
        /// Lấy thông tin quan hệ BẤT KỂ TRẠNG THÁI (Bao gồm cả bản ghi đã bị Soft Delete).
        /// Phục vụ cho việc gửi lại lời mời kết bạn (tái sử dụng bản ghi).
        /// </summary>
        Task<Friendship?> GetFriendshipAnyStateAsync(Guid userId1, Guid userId2);

        /// <summary>
        /// Kiểm tra nhanh xem 2 người dùng có đang là bạn bè (trạng thái Accepted) hay không.
        /// </summary>
        Task<bool> IsFriendAsync(Guid userId1, Guid userId2);

        /// <summary>
        /// Lấy danh sách các lời mời kết bạn ĐƯỢC GỬI ĐẾN (Inbox) đang chờ duyệt - CÓ PHÂN TRANG.
        /// </summary>
        Task<PagedResult<FriendRequestResponseDto>> GetPendingRequestsAsync(Guid userId, int pageNumber, int pageSize);

        /// <summary>
        /// Lấy danh sách các lời mời kết bạn ĐÃ GỬI ĐI (Outbox) chưa được người kia xử lý - CÓ PHÂN TRANG.
        /// </summary>
        Task<PagedResult<SentFriendRequestResponseDto>> GetSentRequestsAsync(Guid userId, int pageNumber, int pageSize);

        /// <summary>
        /// Lấy danh sách bạn bè của một người dùng - CÓ PHÂN TRANG.
        /// </summary>
        Task<PagedResult<FriendshipResponseDto>> GetFriendsAsync(Guid userId, int pageNumber, int pageSize);

        /// <summary>
        /// Lấy danh sách gợi ý kết bạn (người lạ chưa kết bạn, ưu tiên có bạn chung).
        /// </summary>
        Task<List<FriendSuggestionDto>> GetFriendSuggestionsAsync(Guid userId, int count = 10);

        /// <summary>
        /// Đếm tổng số lượng bạn bè hiện tại của một người dùng.
        /// </summary>
        Task<int> GetFriendCountAsync(Guid userId);

        // =====================================================
        // CLOSE FRIEND METHODS (MỚI)
        // =====================================================

        /// <summary>
        /// Kiểm tra xem hai người có phải là bạn thân hay không.
        /// Chỉ trả về true nếu: trạng thái Accepted + IsCloseFriend == true.
        /// </summary>
        Task<bool> IsCloseFriendAsync(Guid userId, Guid otherUserId);

        /// <summary>
        /// Lấy danh sách bạn thân của một người dùng - CÓ PHÂN TRANG.
        /// </summary>
        Task<PagedResult<UserSummaryDto>> GetCloseFriendsAsync(Guid userId, int pageNumber, int pageSize);
    }
}