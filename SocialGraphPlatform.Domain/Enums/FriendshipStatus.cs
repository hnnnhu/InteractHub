namespace SocialGraphPlatform.Domain.Enums
{
    public enum FriendshipStatus
    {
        Pending = 1,   // Đang chờ chấp nhận
        Accepted = 2,  // Đã là bạn bè
        Declined = 3,  // Đã từ chối (người nhận từ chối)
        Removed = 4,   // Đã hủy kết bạn (unfriend)
        Canceled = 5  // Người gửi hủy lời mời
    }
}