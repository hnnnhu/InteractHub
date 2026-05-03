// types/notification.ts

// ────────────────────────────────────────
// 1. Các hằng số loại thông báo (thay thế enum)
// ────────────────────────────────────────
export const NotificationType = {
    System: 1,
    FriendRequest: 2,
    FriendAccepted: 3,
    PostReaction: 4,
    PostComment: 5,
    StoryReaction: 6,
    Mention: 7,
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ────────────────────────────────────────
// 2. Các DTO cho thông báo
// ────────────────────────────────────────

/** Đối tượng thông báo trả về từ API */
export interface NotificationResponseDto {
    /** ID của thông báo */
    id: string; // Guid -> string

    /** ID người kích hoạt (có thể null nếu là hệ thống) */
    triggeredById: string | null;

    /** Tên đăng nhập của người kích hoạt */
    triggeredByUserName: string | null;

    /** Tên đầy đủ của người kích hoạt */
    triggeredByFullName: string | null;

    /** URL ảnh đại diện của người kích hoạt */
    triggeredByAvatarUrl: string | null;

    /** Loại thông báo */
    type: NotificationType;

    /** Nội dung hiển thị */
    content: string;

    /** Đường dẫn điều hướng khi click */
    targetUrl: string | null;

    /** ID của thực thể liên quan (post, comment, friendship...) */
    relatedEntityId: string | null;

    /** Trạng thái đã đọc hay chưa */
    isRead: boolean;

    /** Thời gian tạo */
    createdAt: string; // ISO 8601 date string

    /** Thời điểm được đọc (nếu đã đọc) */
    readAt: string | null;

    /** Mô tả thời gian tương đối (ví dụ "2 phút trước") */
    timeAgo: string;

    /** Số lượng người đã thực hiện cùng hành động được gộp vào một thông báo */
    groupedCount: number;
}

/** DTO gửi lên để đánh dấu đã đọc */
export interface MarkAsReadDto {
    /** Danh sách ID thông báo cần đánh dấu. Bỏ qua nếu markAll = true */
    notificationIds?: string[];

    /** Đặt true để đánh dấu tất cả thông báo chưa đọc là đã đọc */
    markAll: boolean;
}

/** DTO tạo mới một thông báo (dành cho admin hoặc service) */
export interface CreateNotificationDto {
    /** ID người nhận */
    receiverId: string;

    /** ID người kích hoạt (null nếu là hệ thống) */
    triggeredById?: string | null;

    /** Loại thông báo */
    type: NotificationType;

    /** Nội dung thông báo */
    content: string;

    /** Đường dẫn điều hướng (tùy chọn) */
    targetUrl?: string | null;

    /** ID thực thể liên quan */
    relatedEntityId?: string | null;

    /** Cho phép gửi ngay cả khi người dùng đã tắt loại thông báo này */
    bypassUserSettings?: boolean;
}

/** DTO tạo hàng loạt thông báo */
export interface BulkCreateNotificationsDto {
    notifications: CreateNotificationDto[];
}

// ────────────────────────────────────────
// 3. Cài đặt thông báo của người dùng
// ────────────────────────────────────────
export interface NotificationSettingsDto {
    /** Bật/tắt toàn bộ thông báo (Master Switch) */
    enableAllNotifications: boolean;

    /** Nhận thông báo khi có lời mời kết bạn mới */
    friendRequest: boolean;

    /** Nhận thông báo khi ai đó chấp nhận kết bạn */
    friendAccepted: boolean;

    /** Nhận thông báo khi có người thả cảm xúc vào bài viết */
    postReaction: boolean;

    /** Nhận thông báo khi có người bình luận bài viết */
    postComment: boolean;

    /** Nhận thông báo khi có người thả cảm xúc vào Story */
    storyReaction: boolean;

    /** Nhận thông báo khi được @mention */
    mention: boolean;

    /** Bật/tắt toàn bộ push notification */
    pushEnabled: boolean;

    /** Bật chế độ không làm phiền (Quiet Hours) */
    quietHoursEnabled: boolean;

    /** Giờ bắt đầu không làm phiền (0-23) */
    quietHoursStart: number;

    /** Giờ kết thúc không làm phiền (0-23) */
    quietHoursEnd: number;

    /** Nhận thông báo qua email (tương lai) */
    enableEmailNotification: boolean;
}

// ────────────────────────────────────────
// 4. Các kiểu dùng chung cho response API
// ────────────────────────────────────────

/** Response chung của API */
export interface ApiResponse<T = null> {
    /** Thành công hay thất bại */
    isSuccess: boolean;

    /** Thông điệp mô tả */
    message?: string;

    /** Dữ liệu trả về (nếu có) */
    data?: T;

    /** Danh sách lỗi (nếu có) – thường dùng cho validation */
    errors?: string[];
}

/** Kết quả phân trang */
export interface PagedResult<T> {
    /** Danh sách phần tử của trang hiện tại */
    items: T[];

    /** Số trang hiện tại */
    pageNumber: number;

    /** Kích thước trang */
    pageSize: number;

    /** Tổng số phần tử trên tất cả các trang */
    totalCount: number;
}

// ────────────────────────────────────────
// 5. Helper functions (tuỳ chọn, dùng cho UI)
// ────────────────────────────────────────

/** Trả về tên hiển thị của loại thông báo */
export function getNotificationTypeLabel(type: NotificationType): string {
    switch (type) {
        case NotificationType.System: return 'Thông báo hệ thống';
        case NotificationType.FriendRequest: return 'Lời mời kết bạn';
        case NotificationType.FriendAccepted: return 'Đã chấp nhận kết bạn';
        case NotificationType.PostReaction: return 'Cảm xúc bài viết';
        case NotificationType.PostComment: return 'Bình luận bài viết';
        case NotificationType.StoryReaction: return 'Cảm xúc Story';
        case NotificationType.Mention: return 'Nhắc đến bạn';
        default: return 'Thông báo';
    }
}

/** Trả về emoji đại diện cho loại thông báo */
export function getNotificationTypeIcon(type: NotificationType): string {
    switch (type) {
        case NotificationType.System: return '🔔';
        case NotificationType.FriendRequest: return '👤';
        case NotificationType.FriendAccepted: return '🤝';
        case NotificationType.PostReaction: return '❤️';
        case NotificationType.PostComment: return '💬';
        case NotificationType.StoryReaction: return '✨';
        case NotificationType.Mention: return '@';
        default: return '🔔';
    }
}