using System;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO trả về thông tin chi tiết của một mối quan hệ bạn bè.
    /// Bao gồm đầy đủ thông tin 2 chiều (Requester và Addressee).
    /// </summary>
    public class FriendshipResponseDto
    {
        public Guid Id { get; set; }

        // --- Thông tin người gửi lời mời ---
        public Guid RequesterId { get; set; }
        public string RequesterUserName { get; set; } = string.Empty;
        public string RequesterFullName { get; set; } = string.Empty;
        public string? RequesterAvatarUrl { get; set; }

        // --- Thông tin người nhận lời mời ---
        public Guid AddresseeId { get; set; }
        public string AddresseeUserName { get; set; } = string.Empty;
        public string AddresseeFullName { get; set; } = string.Empty;
        public string? AddresseeAvatarUrl { get; set; }

        // --- Trạng thái mối quan hệ ---
        public FriendshipStatus Status { get; set; }

        /// <summary>
        /// Chuỗi hiển thị thân thiện cho UI (Pending, Accepted, Declined...)
        /// </summary>
        public string StatusLabel => Status.ToString();

        /// <summary>
        /// Đánh dấu đây có phải là bạn thân hay không.
        /// Chỉ có ý nghĩa khi Status == Accepted.
        /// </summary>
        public bool IsCloseFriend { get; set; }

        // --- Thời gian ---
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
    }
}