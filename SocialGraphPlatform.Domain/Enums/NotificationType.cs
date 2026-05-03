namespace SocialGraphPlatform.Domain.Enums
{
    public enum NotificationType
    {
        System = 1,             // Thông báo từ hệ thống (VD: Cảnh báo vi phạm)
        FriendRequest = 2,      // Lời mời kết bạn mới
        FriendAccepted = 3,     // Ai đó đã chấp nhận kết bạn
        PostReaction = 4,       // Ai đó đã thả cảm xúc vào bài viết
        PostComment = 5,        // Ai đó đã bình luận vào bài viết
        StoryReaction = 6,      // (Tùy chọn) Ai đó thả tim vào Story
        Mention = 7,            // Ai đó nhắc đến bạn (@tag)
        CloseFriendAdded = 8    // Được thêm vào danh sách bạn thân
    }
}