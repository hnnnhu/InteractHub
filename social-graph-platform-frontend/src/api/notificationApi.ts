// src/api/notificationApi.ts

import axiosInstance from './axiosInstance';
import type { ApiResponse } from './authApi';
import type {
    NotificationResponseDto,
    MarkAsReadDto,
    CreateNotificationDto,
    BulkCreateNotificationsDto,
    NotificationSettingsDto,
    PagedResult,
} from '../types/notification';

const NOTIFICATIONS_URL = '/notifications';

/**
 * Helper: Chuyển đổi đường dẫn tương đối thành URL tuyệt đối
 * (dùng để hiển thị ảnh đại diện của người kích hoạt)
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const notificationApi = {
    // ======================== 1. DANH SÁCH & TRẠNG THÁI THÔNG BÁO ========================

    /**
     * Lấy danh sách thông báo của người dùng hiện tại (phân trang, lọc theo loại và trạng thái đọc)
     * GET /api/notifications?pageNumber=1&pageSize=20&type=1&unreadOnly=true
     */
    getNotifications: async (
        pageNumber: number = 1,
        pageSize: number = 20,
        type?: number,        // NotificationType value: 1..7
        unreadOnly?: boolean
    ): Promise<ApiResponse<PagedResult<NotificationResponseDto>>> => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<NotificationResponseDto>>>(
            NOTIFICATIONS_URL,
            {
                params: {
                    pageNumber,
                    pageSize,
                    type: type !== undefined ? type : undefined,
                    unreadOnly: unreadOnly !== undefined ? unreadOnly : undefined,
                },
            }
        );

        // Chuẩn hóa URL ảnh đại diện trong kết quả trả về
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map((item) => ({
                ...item,
                triggeredByAvatarUrl: resolveUrl(item.triggeredByAvatarUrl),
            }));
        }

        return response.data;
    },

    /**
     * Lấy chi tiết một thông báo
     * GET /api/notifications/{notificationId}
     */
    getById: async (notificationId: string): Promise<ApiResponse<NotificationResponseDto>> => {
        const response = await axiosInstance.get<ApiResponse<NotificationResponseDto>>(
            `${NOTIFICATIONS_URL}/${notificationId}`
        );
        if (response.data?.data) {
            response.data.data.triggeredByAvatarUrl = resolveUrl(response.data.data.triggeredByAvatarUrl);
        }
        return response.data;
    },

    /**
     * Lấy số lượng thông báo chưa đọc (dùng cho badge đỏ trên icon chuông)
     * GET /api/notifications/unread-count
     */
    getUnreadCount: async (): Promise<ApiResponse<number>> => {
        const response = await axiosInstance.get<ApiResponse<number>>(`${NOTIFICATIONS_URL}/unread-count`);
        return response.data;
    },

    /**
     * Đánh dấu thông báo là đã đọc (hỗ trợ đánh dấu nhiều hoặc tất cả)
     * PUT /api/notifications/read
     * Body: { notificationIds?: string[], markAll: boolean }
     */
    markAsRead: async (request: MarkAsReadDto): Promise<ApiResponse> => {
        const response = await axiosInstance.put<ApiResponse>(`${NOTIFICATIONS_URL}/read`, request);
        return response.data;
    },

    // ======================== 2. TẠO MỚI THÔNG BÁO (ADMIN) ========================

    /**
     * Tạo một thông báo mới (dành cho admin hoặc system service)
     * POST /api/notifications
     */
    createNotification: async (request: CreateNotificationDto): Promise<ApiResponse<NotificationResponseDto | null>> => {
        const response = await axiosInstance.post<ApiResponse<NotificationResponseDto | null>>(
            NOTIFICATIONS_URL,
            request
        );
        if (response.data?.data) {
            response.data.data.triggeredByAvatarUrl = resolveUrl(response.data.data.triggeredByAvatarUrl);
        }
        return response.data;
    },

    /**
     * Tạo nhiều thông báo cùng lúc (dành cho thông báo hệ thống hàng loạt)
     * POST /api/notifications/bulk
     */
    bulkCreateNotifications: async (bulkRequest: BulkCreateNotificationsDto): Promise<ApiResponse> => {
        const response = await axiosInstance.post<ApiResponse>(
            `${NOTIFICATIONS_URL}/bulk`,
            bulkRequest
        );
        return response.data;
    },

    // ======================== 3. DỌN DẸP ========================

    /**
     * Xóa các thông báo đã đọc quá hạn của người dùng hiện tại
     * DELETE /api/notifications/cleanup?olderThanDays=90
     */
    deleteOldNotifications: async (olderThanDays: number = 90): Promise<ApiResponse<number>> => {
        const response = await axiosInstance.delete<ApiResponse<number>>(`${NOTIFICATIONS_URL}/cleanup`, {
            params: { olderThanDays },
        });
        return response.data;
    },

    // ======================== 4. CÀI ĐẶT THÔNG BÁO ========================

    /**
     * Lấy cài đặt thông báo của người dùng hiện tại
     * GET /api/notifications/settings
     */
    getNotificationSettings: async (): Promise<ApiResponse<NotificationSettingsDto>> => {
        const response = await axiosInstance.get<ApiResponse<NotificationSettingsDto>>(`${NOTIFICATIONS_URL}/settings`);
        return response.data;
    },

    /**
     * Cập nhật cài đặt thông báo
     * PUT /api/notifications/settings
     */
    updateNotificationSettings: async (settings: NotificationSettingsDto): Promise<ApiResponse> => {
        const response = await axiosInstance.put<ApiResponse>(`${NOTIFICATIONS_URL}/settings`, settings);
        return response.data;
    },
};

export default notificationApi;