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
// 3. HELPER – URL TUYỆT ĐỐI CHO ẢNH
// ==========================================

/**
 * Lấy base URL của thư mục uploads từ biến môi trường.
 * Nếu không có, fallback về cách build từ VITE_API_URL (cắt bỏ /api).
 */
const getUploadBaseUrl = (): string => {
    // Ưu tiên biến môi trường VITE_UPLOAD_URL do bạn tự định nghĩa
    if (import.meta.env.VITE_UPLOAD_URL) {
        return import.meta.env.VITE_UPLOAD_URL as string;
    }

    // Fallback: từ VITE_API_URL (https://interacthub-production-2da1.up.railway.app/api)
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (apiUrl) {
        // Cắt bỏ phần /api ở cuối nếu có
        return apiUrl.replace(/\/api\/?$/, '/uploads');
    }

    // Default cho local dev
    return 'https://localhost:7042/uploads';
};

const UPLOAD_BASE_URL = getUploadBaseUrl();

/**
 * Chuyển đổi đường dẫn ảnh tương đối (hoặc không có scheme) thành URL tuyệt đối.
 * - Nếu URL đã tuyệt đối (http/https/data:) thì giữ nguyên.
 * - Loại bỏ dấu / thừa ở đầu.
 * - Nếu chuỗi đã có sẵn thư mục "uploads/" ở đầu thì cắt bỏ để tránh trùng lặp.
 * - Cuối cùng nối với UPLOAD_BASE_URL.
 */
export const resolveMediaUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    let cleanUrl = url.replace(/^\/+/, ''); // bỏ dấu / ở đầu

    // KIỂM TRA TRÙNG LẶP:
    // Nếu cleanUrl đã có sẵn 'uploads/' ở đầu, ta cắt bỏ nó đi
    // để tránh tình trạng URL bị lặp thành /uploads/uploads/...
    if (cleanUrl.startsWith('uploads/')) {
        cleanUrl = cleanUrl.substring(8); // Cắt bỏ 8 ký tự của chữ "uploads/"
    }

    return `${UPLOAD_BASE_URL}/${cleanUrl}`;
};

// ==========================================
// 4. API ENDPOINTS CHÍNH
// ==========================================

const POSTS_URL = '/posts';
const MEDIA_URL = '/media';
const HASHTAGS_URL = '/hashtags';

export const postApi = {
    /**
     * TẢI LÊN FILE MEDIA (ẢNH, VIDEO)
     * Trả về danh sách URL tuyệt đối (đã được resolve).
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
                    timeout: 180000, // 3 phút
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            console.log(`Đang upload: ${percent}%`);
                        }
                    }
                }
            );

            if (response.data.isSuccess && response.data.data?.urls) {
                // Chuyển tất cả URL về dạng tuyệt đối
                return response.data.data.urls.map(url => resolveMediaUrl(url) as string);
            }

            throw new Error(response.data.message || 'Upload không thành công');
        } catch (error: unknown) {
            console.error('Upload Error:', error);
            if (isAxiosError(error)) {
                // Có thể bổ sung xử lý chi tiết hơn nếu cần
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
                firstMediaUrl: resolveMediaUrl(item.firstMediaUrl),
                avatarUrl: resolveMediaUrl(item.avatarUrl)
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
                firstMediaUrl: resolveMediaUrl(item.firstMediaUrl),
                avatarUrl: resolveMediaUrl(item.avatarUrl)
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
            post.avatarUrl = resolveMediaUrl(post.avatarUrl);
            post.mediaItems = post.mediaItems.map(m => ({
                ...m,
                mediaUrl: resolveMediaUrl(m.mediaUrl) as string
            }));
        }

        return response.data;
    },

    /**
     * TÌM KIẾM BÀI VIẾT THEO TỪ KHÓA
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

        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(item => ({
                ...item,
                firstMediaUrl: resolveMediaUrl(item.firstMediaUrl),
                avatarUrl: resolveMediaUrl(item.avatarUrl)
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
                firstMediaUrl: resolveMediaUrl(item.firstMediaUrl),
                avatarUrl: resolveMediaUrl(item.avatarUrl)
            }));
        }
        return response.data;
    }
};

export default postApi;