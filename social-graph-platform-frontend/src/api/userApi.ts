// src/api/userApi.ts

import { isAxiosError } from 'axios';
import axiosInstance from './axiosInstance';
import type { ApiResponse } from './authApi';
import type { PagedResult } from './postApi';
import type {
    UpdateProfileRequest,
    ChangePasswordRequest,
    UserSearchRequest,
    UserProfileDto,
    UserSummaryDto,
    UserStatsDto,
    UpdatePrivacyRequest,
    TwoFactorSetupDto,
    SessionDto
} from '../types/user';

const USERS_URL = '/users';

// ==========================================
// INTERFACES BỔ SUNG
// ==========================================

/**
 * Các tùy chọn khi tải hình ảnh lên (Avatar/Cover)
 */
export interface UploadOptions {
    /** Hàm callback theo dõi tiến trình upload (0-100%) */
    onUploadProgress?: (progressEvent) => void;
}

/**
 * Helper: Xử lý hiển thị ảnh từ đường dẫn tương đối của Backend
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const userApi = {
    // ==========================================
    // 1. QUẢN LÝ PROFILE & THỐNG KÊ
    // ==========================================

    /**
     * Lấy thông tin cá nhân của chính người dùng đang đăng nhập
     */
    getCurrentUserProfile: async (): Promise<ApiResponse<UserProfileDto>> => {
        const response = await axiosInstance.get<ApiResponse<UserProfileDto>>(`${USERS_URL}/me`);
        if (response.data.data) {
            response.data.data.avatarUrl = resolveUrl(response.data.data.avatarUrl);
            response.data.data.coverPhotoUrl = resolveUrl(response.data.data.coverPhotoUrl);
        }
        return response.data;
    },

    /**
     * Xem profile người khác qua ID
     */
    getUserProfileById: async (targetUserId: string): Promise<ApiResponse<UserProfileDto>> => {
        const response = await axiosInstance.get<ApiResponse<UserProfileDto>>(`${USERS_URL}/${targetUserId}`);
        if (response.data.data) {
            response.data.data.avatarUrl = resolveUrl(response.data.data.avatarUrl);
            response.data.data.coverPhotoUrl = resolveUrl(response.data.data.coverPhotoUrl);
        }
        return response.data;
    },

    /**
     * Xem profile người khác qua Username (Ví dụ: /profile/nhu_huynh)
     */
    getUserProfileByUsername: async (username: string): Promise<ApiResponse<UserProfileDto>> => {
        const response = await axiosInstance.get<ApiResponse<UserProfileDto>>(`${USERS_URL}/profile/${username}`);
        if (response.data.data) {
            response.data.data.avatarUrl = resolveUrl(response.data.data.avatarUrl);
            response.data.data.coverPhotoUrl = resolveUrl(response.data.data.coverPhotoUrl);
        }
        return response.data;
    },

    /**
     * Cập nhật thông tin cơ bản của hồ sơ
     */
    updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.put<ApiResponse>(`${USERS_URL}/profile`, data);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Tìm kiếm người dùng theo tên hoặc username (Phân trang)
     */
    searchUsers: async (params: UserSearchRequest): Promise<ApiResponse<PagedResult<UserSummaryDto>>> => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<UserSummaryDto>>>(`${USERS_URL}/search`, {
            params: {
                keyword: params.keyword,
                pageNumber: params.pageNumber || 1,
                pageSize: params.pageSize || 20
            }
        });

        if (response.data.data?.items) {
            response.data.data.items = response.data.data.items.map(user => ({
                ...user,
                avatarUrl: resolveUrl(user.avatarUrl)
            }));
        }
        return response.data;
    },

    /**
     * Lấy thống kê nhanh (Bài viết, bạn bè, story)
     */
    getUserStats: async (userId: string): Promise<ApiResponse<UserStatsDto>> => {
        const response = await axiosInstance.get<ApiResponse<UserStatsDto>>(`${USERS_URL}/${userId}/stats`);
        return response.data;
    },

    // ==========================================
    // 2. UPLOAD HÌNH ẢNH (AVATAR & COVER)
    // ==========================================

    /**
     * Upload và cập nhật ảnh đại diện mới
     * @param file Tệp tin hình ảnh từ input
     * @param options Tùy chọn theo dõi tiến trình
     */
    uploadAvatar: async (file: File, options?: UploadOptions): Promise<ApiResponse> => {
        try {
            const formData = new FormData();
            formData.append('File', file);
            const response = await axiosInstance.post<ApiResponse>(`${USERS_URL}/me/avatar`, formData, {
                onUploadProgress: options?.onUploadProgress,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Upload và cập nhật ảnh bìa mới
     * @param file Tệp tin hình ảnh từ input
     * @param options Tùy chọn theo dõi tiến trình
     */
    uploadCoverPhoto: async (file: File, options?: UploadOptions): Promise<ApiResponse> => {
        try {
            const formData = new FormData();
            formData.append('File', file);
            const response = await axiosInstance.post<ApiResponse>(`${USERS_URL}/me/cover-photo`, formData, {
                onUploadProgress: options?.onUploadProgress,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    // ==========================================
    // 3. QUẢN LÝ PHIÊN ĐĂNG NHẬP (SESSIONS)
    // ==========================================

    /**
     * Lấy danh sách các phiên đăng nhập đang hoạt động
     */
    getMySessions: async (): Promise<ApiResponse<SessionDto[]>> => {
        const response = await axiosInstance.get<ApiResponse<SessionDto[]>>(`${USERS_URL}/me/sessions`);
        return response.data;
    },

    /**
     * Đăng xuất một thiết bị khác (hủy phiên cụ thể)
     */
    revokeSession: async (sessionId: string): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.delete<ApiResponse>(`${USERS_URL}/me/sessions/${sessionId}`);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Đăng xuất tất cả các thiết bị khác (giữ lại thiết bị hiện tại)
     */
    logoutOtherDevices: async (): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(`${USERS_URL}/me/logout-others`);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Đăng xuất tất cả các thiết bị (bao gồm cả hiện tại)
     */
    logoutAllDevices: async (): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(`${USERS_URL}/me/logout-all`);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    // ==========================================
    // 4. BẢO MẬT & 2FA
    // ==========================================

    /**
     * Đổi mật khẩu tài khoản (Yêu cầu mật khẩu cũ)
     */
    changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.put<ApiResponse>(`${USERS_URL}/change-password`, data);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Lấy thông tin cài đặt 2FA (Secret Key & QR Code URI)
     */
    getTwoFactorSetup: async (): Promise<ApiResponse<TwoFactorSetupDto>> => {
        const response = await axiosInstance.get<ApiResponse<TwoFactorSetupDto>>(`${USERS_URL}/me/2fa/setup`);
        return response.data;
    },

    /**
     * Xác nhận mã và bật 2FA (Trả về danh sách mã khôi phục)
     */
    enableTwoFactor: async (code: string): Promise<ApiResponse<string[]>> => {
        try {
            const response = await axiosInstance.post<ApiResponse<string[]>>(`${USERS_URL}/me/2fa/enable`, { code });
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse<string[]>;
            throw error;
        }
    },

    /**
     * Vô hiệu hóa 2FA (Yêu cầu mã xác thực hiện tại)
     */
    disableTwoFactor: async (code: string): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(`${USERS_URL}/me/2fa/disable`, { code });
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Tạo mới mã khôi phục 2FA
     */
    generateRecoveryCodes: async (): Promise<ApiResponse<string[]>> => {
        try {
            const response = await axiosInstance.post<ApiResponse<string[]>>(`${USERS_URL}/me/2fa/recovery-codes`);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse<string[]>;
            throw error;
        }
    },

    // ==========================================
    // 5. CÀI ĐẶT QUYỀN RIÊNG TƯ & TÀI KHOẢN
    // ==========================================

    /**
     * Cập nhật quyền riêng tư của trang cá nhân
     */
    updatePrivacy: async (data: UpdatePrivacyRequest): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.put<ApiResponse>(`${USERS_URL}/me/privacy`, data);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Người dùng tự vô hiệu hóa tài khoản của mình (Soft Delete)
     */
    deactivateAccount: async (): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.delete<ApiResponse>(`${USERS_URL}/deactivate`);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    },

    /**
     * Khôi phục tài khoản đã bị vô hiệu hóa (trong vòng 30 ngày)
     */
    restoreAccount: async (): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(`${USERS_URL}/me/restore`);
            return response.data;
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.data) return error.response.data as ApiResponse;
            throw error;
        }
    }
};

export default userApi;