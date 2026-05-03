// src/api/savedPostApi.ts

import axiosInstance from './axiosInstance';
import type { ApiResponse } from './authApi';
import type { PagedResult } from '../types/comment';
import type {
    SavePostDto,
    SavedPostResponseDto,
    CollectionDto,
    CreateCollectionDto,
    UpdateCollectionDto
} from '../types/savedPost';

const SAVED_POSTS_URL = '/saved-posts';

/**
 * Helper: Chuyển đổi đường dẫn tương đối thành URL tuyệt đối
 * Ví dụ: "/uploads/image.jpg" -> "https://localhost:7042/uploads/image.jpg"
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    // Lấy baseURL từ axios, cắt bỏ hậu tố '/api' để lấy root URL chứa thư mục /uploads
    // Đã cấu hình chính xác port 7042 khớp với backend .NET
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');

    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const savedPostApi = {
    savePost: async (data: SavePostDto) => {
        const response = await axiosInstance.post<ApiResponse>(SAVED_POSTS_URL, data);
        return response.data;
    },

    unsavePost: async (postId: string) => {
        const response = await axiosInstance.delete<ApiResponse>(`${SAVED_POSTS_URL}/post/${postId}`);
        return response.data;
    },

    toggleSavePost: async (postId: string, isSaved: boolean, collectionName: string = "Mặc định") => {
        if (isSaved) {
            return await savedPostApi.unsavePost(postId);
        } else {
            return await savedPostApi.savePost({ postId, collectionName });
        }
    },

    getSavedPosts: async (collection?: string, pageNumber = 1, pageSize = 10) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<SavedPostResponseDto>>>(
            SAVED_POSTS_URL,
            { params: { collection, pageNumber, pageSize } }
        );

        // Map lại URL thành đường dẫn tuyệt đối cho bài viết
        if (response.data?.isSuccess && response.data.data?.items) {
            response.data.data.items = response.data.data.items.map(item => ({
                ...item,
                postMediaUrl: resolveUrl(item.postMediaUrl),
                postAuthorAvatarUrl: resolveUrl(item.postAuthorAvatarUrl)
            }));
        }
        return response.data;
    },

    getCollections: async () => {
        const response = await axiosInstance.get<ApiResponse<CollectionDto[]>>(
            `${SAVED_POSTS_URL}/collections`
        );

        // Map lại URL cho các ảnh preview trong folder
        if (response.data?.isSuccess && response.data.data) {
            response.data.data = response.data.data.map(col => ({
                ...col,
                // Thêm kiểm tra dự phòng (fallback mảng rỗng) để tránh lỗi nếu backend không trả về previewPosts
                previewPosts: (col.previewPosts || []).map(p => ({
                    ...p,
                    mediaUrl: resolveUrl(p.mediaUrl)
                }))
            }));
        }
        return response.data;
    },

    createCollection: async (data: CreateCollectionDto) => {
        const response = await axiosInstance.post<ApiResponse>(`${SAVED_POSTS_URL}/collections`, data);
        return response.data;
    },

    updateCollection: async (oldName: string, newName: string) => {
        const payload: UpdateCollectionDto = { newName };
        const response = await axiosInstance.put<ApiResponse>(
            `${SAVED_POSTS_URL}/collections/${encodeURIComponent(oldName)}`,
            payload
        );
        return response.data;
    },

    deleteCollection: async (collectionName: string) => {
        const response = await axiosInstance.delete<ApiResponse>(
            `${SAVED_POSTS_URL}/collections/${encodeURIComponent(collectionName)}`
        );
        return response.data;
    }
};

export default savedPostApi;