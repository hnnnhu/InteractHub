// src/api/storyApi.ts

import axiosInstance from './axiosInstance';
import { isAxiosError } from 'axios';
import type { ApiResponse } from './authApi';
import type {
    PagedResult,
    ActiveStoryDto,
    StoryResponseDto,
    CreateStoryDto,
    StoryViewDto,
} from '../types/story';

// -------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------

const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const normalizeStoryResponse = (story: StoryResponseDto): StoryResponseDto => ({
    ...story,
    avatarUrl: resolveUrl(story.avatarUrl),
    mediaUrl: resolveUrl(story.mediaUrl),
    recentViewers: story.recentViewers?.map(viewer => ({
        ...viewer,
        viewerAvatarUrl: resolveUrl(viewer.viewerAvatarUrl),
    })),
});

const normalizeActiveStory = (dto: ActiveStoryDto): ActiveStoryDto => ({
    ...dto,
    avatarUrl: resolveUrl(dto.avatarUrl),
    stories: dto.stories.map(normalizeStoryResponse),
});

const normalizeStoryView = (view: StoryViewDto): StoryViewDto => ({
    ...view,
    viewerAvatarUrl: resolveUrl(view.viewerAvatarUrl),
});

/**
 * Wrapper bắt lỗi mạng và lỗi server.
 * Nếu server trả về response (có data) thì trả về nguyên vẹn.
 * Nếu lỗi mạng (không có response) thì trả về ApiResponse với isSuccess = false và message rõ ràng.
 */
async function safeRequest<T>(request: Promise<{ data: T }>): Promise<T> {
    try {
        const response = await request;
        return response.data;
    } catch (error: unknown) {
        if (isAxiosError(error)) {
            // Server có trả về response (lỗi 4xx, 5xx)
            if (error.response?.data) {
                return error.response.data as T;
            }
            // Lỗi mạng (không nhận được response)
            if (error.request) {
                console.error('❌ Network Error:', error.message);
                return {
                    isSuccess: false,
                    message: 'Không thể kết nối đến máy chủ.',
                } as T;
            }
        }
        // Lỗi không xác định
        return {
            isSuccess: false,
            message: 'Không thể kết nối đến máy chủ.',
        } as T;
    }
}

const STORIES_URL = '/stories';

export const storyApi = {
    async getMyStories(): Promise<ApiResponse<ActiveStoryDto>> {
        const data = await safeRequest<ApiResponse<ActiveStoryDto>>(
            axiosInstance.get(`${STORIES_URL}/me`)
        );
        if (data.data) {
            data.data = normalizeActiveStory(data.data);
        }
        return data;
    },

    async createStory(dto: CreateStoryDto): Promise<ApiResponse<{ id: string }>> {
        return safeRequest<ApiResponse<{ id: string }>>(
            axiosInstance.post(STORIES_URL, dto)
        );
    },

    async deleteStory(storyId: string): Promise<ApiResponse<null>> {
        return safeRequest<ApiResponse<null>>(
            axiosInstance.delete(`${STORIES_URL}/${storyId}`)
        );
    },

    async getActiveStoriesFeed(): Promise<ApiResponse<ActiveStoryDto[]>> {
        const data = await safeRequest<ApiResponse<ActiveStoryDto[]>>(
            axiosInstance.get(`${STORIES_URL}/feed`)
        );
        if (data.data) {
            data.data = data.data.map(normalizeActiveStory);
        }
        return data;
    },

    async getStoryById(storyId: string): Promise<ApiResponse<StoryResponseDto>> {
        const data = await safeRequest<ApiResponse<StoryResponseDto>>(
            axiosInstance.get(`${STORIES_URL}/${storyId}`)
        );
        if (data.data) {
            data.data = normalizeStoryResponse(data.data);
        }
        return data;
    },

    async markAsViewed(storyId: string): Promise<ApiResponse<null>> {
        return safeRequest<ApiResponse<null>>(
            axiosInstance.post(`${STORIES_URL}/${storyId}/view`, {})
        );
    },

    async getStoryViews(
        storyId: string,
        pageNumber = 1,
        pageSize = 20
    ): Promise<ApiResponse<PagedResult<StoryViewDto>>> {
        const safePageSize = Math.min(pageSize, 100);
        const safePageNumber = Math.max(pageNumber, 1);

        const data = await safeRequest<ApiResponse<PagedResult<StoryViewDto>>>(
            axiosInstance.get(`${STORIES_URL}/${storyId}/views`, {
                params: { pageNumber: safePageNumber, pageSize: safePageSize },
            })
        );
        if (data.data?.items) {
            data.data.items = data.data.items.map(normalizeStoryView);
        }
        return data;
    },
};

export default storyApi;