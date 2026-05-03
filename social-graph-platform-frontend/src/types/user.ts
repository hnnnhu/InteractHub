// src/types/user.ts

// ==========================================
// 1. ENUMS
// ==========================================

/**
 * Trạng thái quan hệ bạn bè (Đồng bộ với Backend FriendshipStatus enum)
 */
export const FriendshipStatus = {
    Pending: 1,   // Đang chờ chấp nhận
    Accepted: 2,  // Đã là bạn bè
    Declined: 3,  // Đã từ chối (người nhận từ chối)
    Removed: 4,   // Đã hủy kết bạn (unfriend)
    Canceled: 5   // Người gửi hủy lời mời
} as const;
export type FriendshipStatus = typeof FriendshipStatus[keyof typeof FriendshipStatus];

/**
 * Cấp độ quyền riêng tư (Đồng bộ với Backend PrivacyLevel enum)
 */
export const PrivacyLevel = {
    Public: 1,        // Công khai
    FriendsOnly: 2,   // Bạn bè
    Private: 3,       // Chỉ mình tôi
    CloseFriends: 4   // Bạn thân
} as const;
export type PrivacyLevel = typeof PrivacyLevel[keyof typeof PrivacyLevel];

// ==========================================
// 2. REQUESTS (Payload gửi lên Backend)
// ==========================================

/**
 * Payload cập nhật thông tin hồ sơ
 */
export interface UpdateProfileRequest {
    fullName: string;
    bio?: string | null;
    dateOfBirth?: string | null; // Định dạng ISO: YYYY-MM-DD

    /** @deprecated Tải ảnh lên qua endpoint /me/avatar riêng biệt bằng FormData */
    avatarUrl?: string | null;
    /** @deprecated Tải ảnh bìa lên qua endpoint /me/cover-photo riêng biệt bằng FormData */
    coverPhotoUrl?: string | null;
}

/**
 * Payload thay đổi mật khẩu
 */
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

/**
 * Tham số tìm kiếm người dùng (Query parameters)
 */
export interface UserSearchRequest {
    keyword?: string;
    pageNumber?: number;
    pageSize?: number;
}

/**
 * Payload cập nhật quyền riêng tư
 */
export interface UpdatePrivacyRequest {
    profileVisibility: PrivacyLevel;
}

/**
 * Payload xác minh mã 2FA (Dùng chung cho Enable/Disable)
 */
export interface VerifyTwoFactorRequest {
    code: string;
}

/**
 * Payload tải hình ảnh lên (Dùng cho FormData)
 * Lưu ý: Trong mã TS gọi API, bạn thường dùng FormData object trực tiếp thay vì interface này, 
 * nhưng khai báo ở đây để định nghĩa kiểu dữ liệu.
 */
export interface UploadImageRequest {
    file: File | Blob;
}

// ==========================================
// 3. DTOs (Dữ liệu nhận về từ Backend)
// ==========================================

/**
 * Thông tin hồ sơ chi tiết (Profile Page)
 */
// src/types/user.ts

// ... (các import hoặc định nghĩa khác giữ nguyên)

export interface UserProfileDto {
    id: string;
    userName: string;
    fullName: string;
    bio?: string | null;
    avatarUrl?: string | null;
    coverPhotoUrl?: string | null;
    dateOfBirth?: string | null;
    createdAt: string;

    // Thống kê
    postCount: number;
    friendCount: number;
    storyCount: number;

    // Trạng thái quan hệ với người dùng đang truy cập
    isFriend: boolean;
    isBlocked: boolean;
    friendshipStatus?: FriendshipStatus | null;
    isPrivateProfileView: boolean;

    isCloseFriend?: boolean;

    // 👇 THÊM DÒNG NÀY VÀO ĐỂ FIX LỖI TS 👇
    profileVisibility?: PrivacyLevel;
}
/**
 * Thông tin người dùng rút gọn (Search result, list items)
 */
export interface UserSummaryDto {
    id: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    isFriend: boolean;
    friendshipStatus?: FriendshipStatus | null;
}

/**
 * Thống kê tổng quan của người dùng
 */
export interface UserStatsDto {
    postCount: number;
    friendCount: number;
    storyCount: number;
    savedPostCount: number;
}

/**
 * Cài đặt Xác thực 2 yếu tố (2FA)
 */
export interface TwoFactorSetupDto {
    sharedKey: string;
    authenticatorUri: string;
}

/**
 * Thông tin một phiên đăng nhập (Session)
 */
export interface SessionDto {
    id: string;
    deviceInfo?: string | null;
    ipAddress?: string | null;
    createdAt: string;
    lastActiveAt: string;
    isCurrent: boolean; // Dùng để hiển thị nhãn "Thiết bị hiện tại" trên UI
}

/**
 * Response trả về sau khi tải ảnh lên thành công
 */
export interface UploadImageResponse {
    url: string;
    message?: string;
}