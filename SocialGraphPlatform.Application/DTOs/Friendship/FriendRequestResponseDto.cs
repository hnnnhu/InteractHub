using System;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO trả về thông tin lời mời kết bạn ĐANG CHỜ DUYỆT (Người dùng là người nhận).
    /// </summary>
    public class FriendRequestResponseDto
    {
        public Guid FriendshipId { get; set; }

        // --- Thông tin người gửi lời mời ---
        public Guid RequesterId { get; set; }
        public string RequesterUserName { get; set; } = string.Empty;
        public string RequesterFullName { get; set; } = string.Empty;
        public string? RequesterAvatarUrl { get; set; }
        public string? RequesterBio { get; set; }

        // --- Trạng thái và thời gian ---
        public FriendshipStatus Status { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}