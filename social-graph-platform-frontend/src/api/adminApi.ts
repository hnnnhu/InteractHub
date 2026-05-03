// src/api/adminApi.ts

import { isAxiosError } from 'axios';
import axiosInstance from './axiosInstance';
import type {
    ApiResponse,
    PagedResult,
    AdminDashboard,
    AdminUserSummary,
    AdminUserDetail,
    AdminPost,
    AdminUsersQuery,
    AdminPostsQuery,
} from '../types/admin';

const ADMIN_URL = '/admin';

// --- Helper xử lý lỗi chung ---
const handleApiError = <T>(error: unknown, fallbackMessage: string): ApiResponse<T> => {
    if (isAxiosError(error) && error.response?.data) {
        return error.response.data as ApiResponse<T>;
    }
    return {
        isSuccess: false,
        message: fallbackMessage,
        data: undefined,
        errors: null,
    };
};

export const adminApi = {
    // ──────────────────────────────────
    // 1. Dashboard
    // ──────────────────────────────────
    /**
     * Lấy thống kê tổng quan hệ thống
     * GET /api/admin/dashboard
     */
    getDashboard: async (): Promise<ApiResponse<AdminDashboard>> => {
        try {
            const response = await axiosInstance.get<ApiResponse<AdminDashboard>>(
                `${ADMIN_URL}/dashboard`
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<AdminDashboard>(error, 'Không thể tải dữ liệu thống kê.');
        }
    },

    // ──────────────────────────────────
    // 2. Quản lý người dùng
    // ──────────────────────────────────
    /**
     * Lấy danh sách người dùng (phân trang, tìm kiếm)
     * GET /api/admin/users
     */
    getUsers: async (
        params?: AdminUsersQuery
    ): Promise<ApiResponse<PagedResult<AdminUserSummary>>> => {
        try {
            const response = await axiosInstance.get<ApiResponse<PagedResult<AdminUserSummary>>>(
                `${ADMIN_URL}/users`,
                { params }
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<PagedResult<AdminUserSummary>>(error, 'Không thể tải danh sách người dùng.');
        }
    },

    /**
     * Xem chi tiết một người dùng
     * GET /api/admin/users/{userId}
     */
    getUserDetail: async (userId: string): Promise<ApiResponse<AdminUserDetail>> => {
        try {
            const response = await axiosInstance.get<ApiResponse<AdminUserDetail>>(
                `${ADMIN_URL}/users/${userId}`
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<AdminUserDetail>(error, 'Không thể tải thông tin người dùng.');
        }
    },

    /**
     * Khóa tài khoản người dùng
     * POST /api/admin/users/{userId}/ban
     */
    banUser: async (userId: string): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(
                `${ADMIN_URL}/users/${userId}/ban`
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<void>(error, 'Không thể khóa tài khoản.');
        }
    },

    /**
     * Mở khóa tài khoản người dùng
     * POST /api/admin/users/{userId}/unban
     */
    unbanUser: async (userId: string): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(
                `${ADMIN_URL}/users/${userId}/unban`
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<void>(error, 'Không thể mở khóa tài khoản.');
        }
    },

    /**
     * Thêm vai trò (role) cho người dùng
     * POST /api/admin/users/{userId}/roles
     * Body: string (ví dụ "Admin", "Moderator")
     */
    addRole: async (userId: string, roleName: string): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse>(
                `${ADMIN_URL}/users/${userId}/roles`,
                `"${roleName}"`, // Backend nhận raw string nên cần serialize đúng
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<void>(error, 'Không thể thêm vai trò.');
        }
    },

    /**
     * Xóa vai trò (role) khỏi người dùng
     * DELETE /api/admin/users/{userId}/roles/{roleName}
     */
    removeRole: async (userId: string, roleName: string): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.delete<ApiResponse>(
                `${ADMIN_URL}/users/${userId}/roles/${encodeURIComponent(roleName)}`
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<void>(error, 'Không thể xóa vai trò.');
        }
    },

    // ──────────────────────────────────
    // 3. Quản lý bài viết
    // ──────────────────────────────────
    /**
     * Lấy danh sách tất cả bài viết (hỗ trợ tìm kiếm, phân trang)
     * GET /api/admin/posts
     */
    getPosts: async (
        params?: AdminPostsQuery
    ): Promise<ApiResponse<PagedResult<AdminPost>>> => {
        try {
            const response = await axiosInstance.get<ApiResponse<PagedResult<AdminPost>>>(
                `${ADMIN_URL}/posts`,
                { params }
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<PagedResult<AdminPost>>(error, 'Không thể tải danh sách bài viết.');
        }
    },

    /**
     * Xóa bài viết (soft delete)
     * DELETE /api/admin/posts/{postId}
     */
    deletePost: async (postId: string): Promise<ApiResponse> => {
        try {
            const response = await axiosInstance.delete<ApiResponse>(
                `${ADMIN_URL}/posts/${postId}`
            );
            return response.data;
        } catch (error: unknown) {
            return handleApiError<void>(error, 'Không thể xóa bài viết.');
        }
    },
};

export default adminApi;