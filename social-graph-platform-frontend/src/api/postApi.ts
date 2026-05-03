// src/api/postApi.ts

import { isAxiosError } from 'axios';
import axiosInstance from './axiosInstance';
import type { ApiResponse } from './authApi';

// ==========================================
// 1. ENUMS (Đồng bộ chính xác 100% với Backend C#)
// ==========================================

export const PrivacyLevel = {
    Public: 1,
    FriendsOnly: 2,
    Private: 3,
    CloseFriends: 4,
} as const;

export const MediaType = {
    None: 0,
    Image: 1,
    Video: 2,
    Audio: 3,
    Document: 4,
} as const;

// ==========================================
// 2. INTERFACES (Map 1:1 với DTO Backend)
// ==========================================

// --- Request Params ---
export interface PostSearchRequest {
    keyword: string;
    pageNumber?: number;
    pageSize?: number;
}

// --- Request Payloads ---
export interface CreatePostRequest {
    content?: string;
    privacy?: number;                    // PrivacyLevel
    mediaUrls?: string[];
    hashtags?: string[];
}

export interface UpdatePostRequest {
    postId: string;
    content?: string;
    privacy: number;                     // PrivacyLevel
}

// --- Response DTOs ---
export interface PostMediaDto {
    id: string;
    mediaUrl: string;
    type: number;                        // MediaType
    sortOrder: number;
}

export interface PostSummaryDto {
    id: string;
    userId: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    content?: string;
    privacy: number;                     // PrivacyLevel
    createdAt: string;
    firstMediaUrl?: string | null;
    mediaCount: number;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    isSavedByCurrentUser: boolean;
    hashtags: string[];                  // Mảng hashtags để hiển thị
}

export interface PostResponseDto {
    id: string;
    userId: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    content?: string;
    privacy: number;
    createdAt: string;
    updatedAt?: string | null;
    mediaItems: PostMediaDto[];
    likeCount: number;
    commentCount: number;
    shareCount: number;
    isLikedByCurrentUser: boolean;
    isSavedByCurrentUser: boolean;
    hashtags: string[];
}

export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface UploadResult {
    urls: string[];
    totalFiles: number;
    successCount: number;
}

// --- HASHTAG DTOs ---
export interface HashtagDto {
    id: string;
    name: string;
    usageCount: number;
    createdAt: string;
}

export interface TrendingHashtagDto {
    name: string;
    usageCount: number;
    rank: number;
    changePercent?: number | null;
}

export interface HashtagWithPostsDto {
    name: string;
    usageCount: number;
    posts: PostSummaryDto[];
}

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

const POSTS_URL = '/posts';
const MEDIA_URL = '/media';
const HASHTAGS_URL = '/hashtags';

/**
 * Hàm xử lý chuẩn hóa URL để gắn thêm Domain của Backend nếu bị thiếu.
 * Tránh lỗi vỡ ảnh khi lưu URL dạng relative path trong Database.
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, ''); // Cắt bỏ chữ /api ở cuối

    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ==========================================
// 4. API ENDPOINTS CHÍNH
// ==========================================

export const postApi = {
    /**
     * TẢI LÊN FILE MEDIA (ẢNH, VIDEO)
     */
    uploadMedia: async (files: File[]): Promise<string[]> => {
        if (files.length === 0) return [];

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const response = await axiosInstance.post<ApiResponse<UploadResult>>(
                `${MEDIA_URL}/upload`,
                formData,
                {
                    timeout: 180000, // Timeout 3 phút cho file nặng
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            console.log(`Đang upload: ${percent}%`);
                        }
                    }
                }
            );

            if (response.data.isSuccess && response.data.data?.urls && response.data.data.urls.length > 0) {
                const fullUrls = response.data.data.urls.map(url => resolveUrl(url) as string);
                return fullUrls;
            }

            throw new Error(response.data.message || 'Upload không thành công');
        } catch (error: unknown) {
            console.error('Upload Error:', error);
            if (isAxiosError(error)) {
                // Xử lý các lỗi cụ thể từ Axios
                return [];
            }
            throw error;
        }
    },

    /**
     * TẠO BÀI VIẾT MỚI
     */
    createPost: async (data: CreatePostRequest) => {
        const response = await axiosInstance.post<ApiResponse<{ id: string }>>(
            POSTS_URL,
            {
                content: data.content,
                privacy: data.privacy ?? PrivacyLevel.Public,
                mediaUrls: data.mediaUrls ?? [],
                hashtags: data.hashtags ?? [],
            }
        );
        return response.data;
    },

    /**
     * SỬA BÀI VIẾT
     */
    updatePost: async (data: UpdatePostRequest) => {
        const response = await axiosInstance.put<ApiResponse>(
            `${POSTS_URL}/${data.postId}`,
            {
                postId: data.postId,
                content: data.content,
                privacy: data.privacy,
            }
        );
        return response.data;
    },

    /**
     * XÓA BÀI VIẾT
     */
    deletePost: async (postId: string) => {
        const response = await axiosInstance.delete<ApiResponse>(`${POSTS_URL}/${postId}`);
        return response.data;
    },

    /**
     * LẤY BẢNG TIN (NEWS FEED)
     */
    getNewsFeed: async (pageNumber = 1, pageSize = 10) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<PostSummaryDto>>>(
            `${POSTS_URL}/feed`,
            { params: { pageNumber, pageSize } }
        );

        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(item => ({
                ...item,
                firstMediaUrl: resolveUrl(item.firstMediaUrl),
                avatarUrl: resolveUrl(item.avatarUrl)
            }));
        }

        return response.data;
    },

    /**
     * LẤY BÀI VIẾT CỦA 1 NGƯỜI DÙNG (PROFILE)
     */
    getUserPosts: async (targetUserId: string, pageNumber = 1, pageSize = 10) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<PostSummaryDto>>>(
            `${POSTS_URL}/user/${targetUserId}`,
            { params: { pageNumber, pageSize } }
        );

        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(item => ({
                ...item,
                firstMediaUrl: resolveUrl(item.firstMediaUrl),
                avatarUrl: resolveUrl(item.avatarUrl)
            }));
        }

        return response.data;
    },

    /**
     * LẤY CHI TIẾT 1 BÀI VIẾT KÈM TẤT CẢ MEDIA
     */
    getPostById: async (postId: string) => {
        const response = await axiosInstance.get<ApiResponse<PostResponseDto>>(
            `${POSTS_URL}/${postId}`
        );

        if (response.data?.data) {
            const post = response.data.data;
            post.avatarUrl = resolveUrl(post.avatarUrl);
            post.mediaItems = post.mediaItems.map(m => ({
                ...m,
                mediaUrl: resolveUrl(m.mediaUrl) as string
            }));
        }

        return response.data;
    },

    /**
     * TÌM KIẾM BÀI VIẾT THEO TỪ KHÓA (NEW)
     * GET /api/posts/search?keyword=...&pageNumber=...&pageSize=...
     */
    searchPosts: async (params: PostSearchRequest): Promise<ApiResponse<PagedResult<PostSummaryDto>>> => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<PostSummaryDto>>>(
            `${POSTS_URL}/search`,
            {
                params: {
                    keyword: params.keyword,
                    pageNumber: params.pageNumber || 1,
                    pageSize: params.pageSize || 10
                }
            }
        );

        // Chuẩn hóa URL cho ảnh đại diện và media trong kết quả tìm kiếm
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(item => ({
                ...item,
                firstMediaUrl: resolveUrl(item.firstMediaUrl),
                avatarUrl: resolveUrl(item.avatarUrl)
            }));
        }

        return response.data;
    }
};

// ==========================================
// 5. HASHTAG API CHUYÊN BIỆT
// ==========================================
export const hashtagApi = {
    searchHashtags: async (keyword: string, pageNumber = 1, pageSize = 10) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<HashtagDto>>>(HASHTAGS_URL, {
            params: { keyword, pageNumber, pageSize }
        });
        return response.data;
    },

    getTrending: async (count = 10) => {
        const response = await axiosInstance.get<ApiResponse<TrendingHashtagDto[]>>(`${HASHTAGS_URL}/trending`, {
            params: { count }
        });
        return response.data;
    },

    getHashtagWithPosts: async (name: string, pageNumber = 1, pageSize = 10) => {
        const encodedName = encodeURIComponent(name.replace(/^#/, ''));
        const response = await axiosInstance.get<ApiResponse<HashtagWithPostsDto>>(`${HASHTAGS_URL}/${encodedName}`, {
            params: { pageNumber, pageSize }
        });

        if (response.data?.data?.posts) {
            response.data.data.posts = response.data.data.posts.map(item => ({
                ...item,
                firstMediaUrl: resolveUrl(item.firstMediaUrl),
                avatarUrl: resolveUrl(item.avatarUrl)
            }));
        }
        return response.data;
    }
};

export default postApi;