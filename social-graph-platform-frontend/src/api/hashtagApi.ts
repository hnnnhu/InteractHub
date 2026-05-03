// src/api/hashtagApi.ts

import axiosInstance from './axiosInstance';
import type { ApiResponse } from './authApi';
import type { PagedResult, PostSummaryDto } from './postApi';

const HASHTAGS_URL = '/hashtags';

const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ==========================================
// 1. INTERFACES (Đồng bộ chính xác với Backend DTOs)
// ==========================================

export interface HashtagSearchDto {
    keyword?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortDescending?: boolean;
}

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
    changePercent?: number | null; // C# là int?
}

export interface HashtagWithPostsDto {
    name: string;
    usageCount: number;
    posts: PostSummaryDto[];
}

// ==========================================
// 2. API ENDPOINTS
// ==========================================

export const hashtagApi = {
    searchHashtags: async (params: HashtagSearchDto) => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<HashtagDto>>>(
            HASHTAGS_URL,
            { params }
        );
        return response.data;
    },

    getTrendingHashtags: async (count: number = 10) => {
        const response = await axiosInstance.get<ApiResponse<TrendingHashtagDto[]>>(
            `${HASHTAGS_URL}/trending`,
            { params: { count } }
        );
        return response.data;
    },

    getHashtagWithPosts: async (name: string, pageNumber: number = 1, pageSize: number = 10) => {
        const encodedName = encodeURIComponent(name.replace(/^#/, ''));
        const response = await axiosInstance.get<ApiResponse<HashtagWithPostsDto>>(
            `${HASHTAGS_URL}/${encodedName}`,
            { params: { pageNumber, pageSize } }
        );

        if (response.data?.isSuccess && response.data.data?.posts) {
            response.data.data.posts = response.data.data.posts.map(post => ({
                ...post,
                avatarUrl: resolveUrl(post.avatarUrl) || undefined,
                firstMediaUrl: resolveUrl(post.firstMediaUrl) || undefined
            }));
        }

        return response.data;
    },

    deleteHashtag: async (name: string) => {
        const encodedName = encodeURIComponent(name.replace(/^#/, ''));
        const response = await axiosInstance.delete<ApiResponse>(
            `${HASHTAGS_URL}/${encodedName}`
        );
        return response.data;
    }
};

export default hashtagApi;