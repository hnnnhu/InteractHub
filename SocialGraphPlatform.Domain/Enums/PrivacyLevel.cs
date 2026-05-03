namespace SocialGraphPlatform.Domain.Enums
{
    /// <summary>
    /// Phân loại cấp độ quyền riêng tư (Ai có thể xem nội dung này).
    /// Dùng chung cho Bài viết (Post), Tin 24h (Story), và có thể là cả Album/Profile.
    /// </summary>
    public enum PrivacyLevel
    {
        /// <summary>
        /// Công khai: Bất kỳ ai trên nền tảng (thậm chí là khách chưa đăng nhập, tùy cấu hình) đều có thể xem.
        /// </summary>
        Public = 1,

        /// <summary>
        /// Bạn bè: Chỉ những người đã kết bạn (FriendshipStatus = Accepted) mới được xem.
        /// </summary>
        FriendsOnly = 2,

        /// <summary>
        /// Chỉ mình tôi: Riêng tư tuyệt đối, chỉ tác giả mới thấy.
        /// Thường dùng khi người dùng muốn lưu trữ làm kỷ niệm cá nhân.
        /// </summary>
        Private = 3,

        /// <summary>
        /// Bạn thân: Chỉ những người nằm trong danh sách "Close Friends" mới được xem.
        /// (Đây là tính năng rất phổ biến cho Story trên Instagram/Facebook).
        /// </summary>
        CloseFriends = 4
    }
}