// src/types/privacy.ts

// ==========================================
// 1. ENUMS
// ==========================================

/**
 * Phân loại cấp độ quyền riêng tư (Ai có thể xem nội dung này).
 * Dùng chung cho Bài viết (Post), Tin 24h (Story), và Profile.
 * Đồng bộ 1-1 với PrivacyLevel enum ở Backend (.NET).
 */
export const PrivacyLevel = {
    /** * Công khai: Bất kỳ ai trên nền tảng đều có thể xem. 
     */
    Public: 1,

    /** * Bạn bè: Chỉ những người đã kết bạn (FriendshipStatus = Accepted) mới được xem. 
     */
    FriendsOnly: 2,

    /** * Chỉ mình tôi: Riêng tư tuyệt đối, chỉ tác giả mới thấy. 
     */
    Private: 3,

    /** * Bạn thân: Chỉ những người nằm trong danh sách "Close Friends" mới được xem. 
     */
    CloseFriends: 4
} as const;

export type PrivacyLevel = typeof PrivacyLevel[keyof typeof PrivacyLevel];

// ==========================================
// 2. REQUESTS (Payload gửi lên Backend)
// ==========================================

/**
 * Payload dùng để cập nhật thiết lập quyền riêng tư của người dùng
 */
export interface UpdatePrivacyRequest {
    profileVisibility: PrivacyLevel;
}