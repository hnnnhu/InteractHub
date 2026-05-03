// src/api/reactionApi.ts

import axiosInstance from './axiosInstance';
import type { ApiResponse } from './authApi';
import type { PagedResult } from '../types/comment';

// [ĐÃ FIX]: Xóa ReactionType vì không sử dụng trực tiếp trong file này
// Chỉ giữ lại các DTO dùng cho input/output của API
import type {
    AddReactionDto,
    ReactionCountDto,
    UserReactionDto
} from '../types/reaction';

const REACTIONS_URL = '/reactions';

// ==========================================
// HELPER FUNCTION
// ==========================================

/**
 * Xử lý chuẩn hóa URL để gắn thêm Domain của Backend nếu bị thiếu.
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ==========================================
// API ENDPOINTS
// ==========================================

export const reactionApi = {
    /**
     * 1. Thả cảm xúc hoặc Cập nhật cảm xúc (Toggle)
     * POST /api/reactions
     */
    addOrUpdateReaction: async (data: AddReactionDto) => {
        const response = await axiosInstance.post<ApiResponse<ReactionCountDto>>(
            REACTIONS_URL,
            data
        );

        if (response.data?.isSuccess && response.data.data?.reactions) {
            response.data.data.reactions.forEach(reaction => {
                if (reaction.recentUsers) {
                    reaction.recentUsers = reaction.recentUsers.map(user => ({
                        ...user,
                        avatarUrl: resolveUrl(user.avatarUrl) || undefined
                    }));
                }
            });
        }

        return response.data;
    },

    /**
     * 2. Xóa cảm xúc của người dùng hiện tại khỏi bài viết
     * DELETE /api/reactions/post/{postId}
     */
    removeReaction: async (postId: string) => {
        const response = await axiosInstance.delete<ApiResponse>(
            `${REACTIONS_URL}/post/${postId}`
        );
        return response.data;
    },

    /**
     * 3. Lấy bảng tóm tắt cảm xúc của một bài viết
     * GET /api/reactions/post/{postId}/summary
     */
    getReactionSummary: async (postId: string) => {
        const response = await axiosInstance.get<ApiResponse<ReactionCountDto>>(
            `${REACTIONS_URL}/post/${postId}/summary`
        );

        if (response.data?.isSuccess && response.data.data?.reactions) {
            response.data.data.reactions.forEach(reaction => {
                if (reaction.recentUsers) {
                    reaction.recentUsers = reaction.recentUsers.map(user => ({
                        ...user,
                        avatarUrl: resolveUrl(user.avatarUrl) || undefined
                    }));
                }
            });
        }

        return response.data;
    },

    /**
     * 4. Lấy danh sách chi tiết tất cả những người dùng đã thả cảm xúc
     * GET /api/reactions/post/{postId}/users
     */
    getUsersReacted: async (postId: string, pageNumber = 1, pageSize = 20) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<UserReactionDto>>>(
            `${REACTIONS_URL}/post/${postId}/users`,
            {
                params: { pageNumber, pageSize }
            }
        );

        if (response.data?.isSuccess && response.data.data?.items) {
            response.data.data.items = response.data.data.items.map(user => ({
                ...user,
                avatarUrl: resolveUrl(user.avatarUrl) || undefined
            }));
        }

        return response.data;
    }
};

export default reactionApi;