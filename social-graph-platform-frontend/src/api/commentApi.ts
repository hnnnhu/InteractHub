// src/api/commentApi.ts

import axiosInstance from './axiosInstance';
import type { ApiResponse } from './authApi';
import type {
    CreateCommentDto,
    UpdateCommentDto,
    CommentResponseDto,
    CommentReplyDto,
    PagedResult
} from '../types/comment';

const COMMENTS_URL = '/comments';

/**
 * Hàm xử lý chuẩn hóa URL để gắn thêm Domain của Backend nếu bị thiếu.
 * Giúp hiển thị Avatar chính xác.
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, ''); // Cắt bỏ chữ /api ở cuối

    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const commentApi = {
    /**
     * 1. Đăng bình luận mới (Hỗ trợ lồng nhau)
     * POST /api/comments
     */
    createComment: async (data: CreateCommentDto) => {
        const response = await axiosInstance.post<ApiResponse<{ id: string }>>(
            COMMENTS_URL,
            data
        );
        return response.data;
    },

    /**
     * 2. Cập nhật nội dung bình luận 
     * PUT /api/comments/{id}
     */
    updateComment: async (id: string, content: string) => {
        const payload: UpdateCommentDto = { content };
        const response = await axiosInstance.put<ApiResponse>(
            `${COMMENTS_URL}/${id}`,
            payload
        );
        return response.data;
    },

    /**
     * 3. Xóa bình luận (Soft Delete qua Backend)
     * DELETE /api/comments/{id}
     */
    deleteComment: async (id: string) => {
        const response = await axiosInstance.delete<ApiResponse>(
            `${COMMENTS_URL}/${id}`
        );
        return response.data;
    },

    /**
     * 4. Lấy danh sách bình luận gốc (Cấp 1) của một bài viết
     * GET /api/comments/post/{postId}
     */
    getCommentsByPost: async (postId: string, pageNumber = 1, pageSize = 10) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<CommentResponseDto>>>(
            `${COMMENTS_URL}/post/${postId}`,
            {
                params: { pageNumber, pageSize }
            }
        );

        // Chuẩn hóa AvatarUrl cho comment gốc và cả các replies đi kèm (nếu có fetch sẵn 2 cái đầu)
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(item => ({
                ...item,
                avatarUrl: resolveUrl(item.avatarUrl),
                replies: item.replies?.map(reply => ({
                    ...reply,
                    avatarUrl: resolveUrl(reply.avatarUrl)
                })) || []
            }));
        }

        return response.data;
    },

    /**
     * 5. Lấy danh sách câu trả lời (Replies) của BẤT KỲ bình luận cha nào
     * GET /api/comments/{id}/replies
     */
    getReplies: async (parentCommentId: string, pageNumber = 1, pageSize = 10) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<CommentReplyDto>>>(
            `${COMMENTS_URL}/${parentCommentId}/replies`,
            {
                params: { pageNumber, pageSize }
            }
        );

        // Chuẩn hóa AvatarUrl cho các reply
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(item => ({
                ...item,
                avatarUrl: resolveUrl(item.avatarUrl)
            }));
        }

        return response.data;
    }
};

export default commentApi;