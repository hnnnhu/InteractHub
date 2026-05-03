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

/**
 * Chuyển đổi đường dẫn tương đối thành URL tuyệt đối
 * để hiển thị ảnh/media đúng trên client.
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Chuẩn hóa URL cho một StoryResponseDto (avatar, media, recent viewers).
 */
const normalizeStoryResponse = (story: StoryResponseDto): StoryResponseDto => ({
    ...story,
    avatarUrl: resolveUrl(story.avatarUrl),
    mediaUrl: resolveUrl(story.mediaUrl),
    recentViewers: story.recentViewers?.map(viewer => ({
        ...viewer,
        viewerAvatarUrl: resolveUrl(viewer.viewerAvatarUrl),
    })),
});

/**
 * Chuẩn hóa URL cho một ActiveStoryDto (bao gồm cả danh sách story bên trong).
 */
const normalizeActiveStory = (dto: ActiveStoryDto): ActiveStoryDto => ({
    ...dto,
    avatarUrl: resolveUrl(dto.avatarUrl),
    stories: dto.stories.map(normalizeStoryResponse),
});

/**
 * Chuẩn hóa URL cho một StoryViewDto (avatar của người xem).
 */
const normalizeStoryView = (view: StoryViewDto): StoryViewDto => ({
    ...view,
    viewerAvatarUrl: resolveUrl(view.viewerAvatarUrl),
});

/**
 * Bọc request để bắt lỗi và trả về ApiResponse thất bại nếu có lỗi mạng hoặc lỗi bất ngờ.
 */
async function safeRequest<T>(request: Promise<{ data: T }>): Promise<T> {
    try {
        const response = await request;
        return response.data;
    } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.data) {
            return error.response.data as T;
        }
        return {
            isSuccess: false,
            message: 'Không thể kết nối đến máy chủ.',
        } as T;
    }
}

// -------------------------------------------------------------------
// API endpoints
// -------------------------------------------------------------------

const STORIES_URL = '/stories';

export const storyApi = {
    /**
     * Lấy danh sách Story đang hoạt động của chính mình
     * GET /api/stories/me
     */
    async getMyStories(): Promise<ApiResponse<ActiveStoryDto>> {
        const data = await safeRequest<ApiResponse<ActiveStoryDto>>(
            axiosInstance.get(`${STORIES_URL}/me`)
        );
        if (data.data) {
            data.data = normalizeActiveStory(data.data);
        }
        return data;
    },

    /**
     * Đăng một Story mới
     * POST /api/stories
     */
    async createStory(dto: CreateStoryDto): Promise<ApiResponse<{ id: string }>> {
        return safeRequest<ApiResponse<{ id: string }>>(
            axiosInstance.post(STORIES_URL, dto)
        );
    },

    /**
     * Xoá Story trước khi hết hạn
     * DELETE /api/stories/{id}
     */
    async deleteStory(storyId: string): Promise<ApiResponse<null>> {
        return safeRequest<ApiResponse<null>>(
            axiosInstance.delete(`${STORIES_URL}/${storyId}`)
        );
    },

    /**
     * Lấy bảng tin Story của bạn bè (Story Tray)
     * GET /api/stories/feed
     */
    async getActiveStoriesFeed(): Promise<ApiResponse<ActiveStoryDto[]>> {
        const data = await safeRequest<ApiResponse<ActiveStoryDto[]>>(
            axiosInstance.get(`${STORIES_URL}/feed`)
        );
        if (data.data) {
            data.data = data.data.map(normalizeActiveStory);
        }
        return data;
    },

    /**
     * Xem chi tiết một Story cụ thể theo ID
     * GET /api/stories/{id}
     */
    async getStoryById(storyId: string): Promise<ApiResponse<StoryResponseDto>> {
        const data = await safeRequest<ApiResponse<StoryResponseDto>>(
            axiosInstance.get(`${STORIES_URL}/${storyId}`)
        );
        if (data.data) {
            data.data = normalizeStoryResponse(data.data);
        }
        return data;
    },

    /**
     * Đánh dấu đã xem một Story
     * POST /api/stories/{id}/view
     */
    async markAsViewed(storyId: string): Promise<ApiResponse<null>> {
        return safeRequest<ApiResponse<null>>(
            axiosInstance.post(`${STORIES_URL}/${storyId}/view`)
        );
    },

    /**
     * Lấy danh sách những người đã xem một Story (chỉ tác giả)
     * GET /api/stories/{id}/views?pageNumber=&pageSize=
     */
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