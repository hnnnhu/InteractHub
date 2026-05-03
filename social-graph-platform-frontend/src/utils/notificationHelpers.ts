// utils/notificationHelpers.ts

import axiosInstance from '../api/axiosInstance';
import { NotificationType } from '../types/notification';

/**
 * Chuyển đổi đường dẫn tương đối (ví dụ: "/uploads/avatar.jpg")
 * thành URL tuyệt đối dựa trên base URL của API.
 * Sử dụng chung cho toàn bộ ứng dụng.
 */
export function resolveUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Lấy tên hiển thị của loại thông báo (tiếng Việt)
 */
export function getNotificationTypeLabel(type: NotificationType): string {
    switch (type) {
        case NotificationType.System:
            return 'Thông báo hệ thống';
        case NotificationType.FriendRequest:
            return 'Lời mời kết bạn';
        case NotificationType.FriendAccepted:
            return 'Đã chấp nhận kết bạn';
        case NotificationType.PostReaction:
            return 'Cảm xúc bài viết';
        case NotificationType.PostComment:
            return 'Bình luận bài viết';
        case NotificationType.StoryReaction:
            return 'Cảm xúc Story';
        case NotificationType.Mention:
            return 'Nhắc đến bạn';
        default:
            return 'Thông báo';
    }
}

/**
 * Lấy biểu tượng emoji đại diện cho loại thông báo
 */
export function getNotificationTypeIcon(type: NotificationType): string {
    switch (type) {
        case NotificationType.System:
            return '🔔';
        case NotificationType.FriendRequest:
            return '👤';
        case NotificationType.FriendAccepted:
            return '🤝';
        case NotificationType.PostReaction:
            return '❤️';
        case NotificationType.PostComment:
            return '💬';
        case NotificationType.StoryReaction:
            return '✨';
        case NotificationType.Mention:
            return '@';
        default:
            return '🔔';
    }
}