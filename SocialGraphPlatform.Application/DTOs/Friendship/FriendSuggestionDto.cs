using System;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO trả về thông tin một người dùng được gợi ý kết bạn.
    /// </summary>
    public class FriendSuggestionDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }

        /// <summary>
        /// Lý do gợi ý (tùy chọn) - Ví dụ: "Có bạn chung", "Từ thành phố của bạn"...
        /// </summary>
        public string? SuggestionReason { get; set; }

        /// <summary>
        /// Số lượng bạn chung giữa người dùng hiện tại và người được gợi ý
        /// </summary>
        public int MutualFriendsCount { get; set; }
    }
}