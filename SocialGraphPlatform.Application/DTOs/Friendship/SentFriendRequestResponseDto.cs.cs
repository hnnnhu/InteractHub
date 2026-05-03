using System;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO trả về thông tin lời mời kết bạn ĐÃ GỬI ĐI (Người dùng là người gửi).
    /// Dùng để quản lý tab "Lời mời đã gửi" và cho phép thu hồi (Cancel).
    /// </summary>
    public class SentFriendRequestResponseDto
    {
        public Guid FriendshipId { get; set; }

        // --- Thông tin người NHẬN lời mời (Addressee) ---
        public Guid AddresseeId { get; set; }
        public string AddresseeUserName { get; set; } = string.Empty;
        public string AddresseeFullName { get; set; } = string.Empty;
        public string? AddresseeAvatarUrl { get; set; }

        // --- Trạng thái và thời gian ---
        public FriendshipStatus Status { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}