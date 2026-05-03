// src/api/friendshipApi.ts

import axiosInstance from './axiosInstance';
import type {
    SendFriendRequestDto,
    FriendRequestResponseDto,
    SentFriendRequestResponseDto,
    FriendshipResponseDto,
    FriendSuggestionDto,
    FriendCountResponseDto,
    UserSummaryDto,
    PagedResult,
    ApiResponse,
} from '../types/friendship';

const FRIENDSHIPS_URL = '/friendships';

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

export const friendshipApi = {
    // =========================================================
    // 1. THAO TÁC LỜI MỜI KẾT BẠN
    // =========================================================
    sendRequest: async (data: SendFriendRequestDto): Promise<ApiResponse> => {
        const response = await axiosInstance.post<ApiResponse>(
            `${FRIENDSHIPS_URL}/requests`,
            data
        );
        return response.data;
    },

    acceptRequest: async (friendshipId: string): Promise<ApiResponse> => {
        const response = await axiosInstance.put<ApiResponse>(
            `${FRIENDSHIPS_URL}/requests/${friendshipId}/accept`
        );
        return response.data;
    },

    rejectRequest: async (friendshipId: string): Promise<ApiResponse> => {
        const response = await axiosInstance.put<ApiResponse>(
            `${FRIENDSHIPS_URL}/requests/${friendshipId}/reject`
        );
        return response.data;
    },

    cancelRequest: async (friendshipId: string): Promise<ApiResponse> => {
        const response = await axiosInstance.delete<ApiResponse>(
            `${FRIENDSHIPS_URL}/requests/${friendshipId}/cancel`
        );
        return response.data;
    },

    unfriend: async (friendId: string): Promise<ApiResponse> => {
        const response = await axiosInstance.delete<ApiResponse>(
            `${FRIENDSHIPS_URL}/friends/${friendId}`
        );
        return response.data;
    },

    // =========================================================
    // 2. TRUY VẤN DANH SÁCH
    // =========================================================
    getPendingRequests: async (
        pageNumber = 1,
        pageSize = 20
    ): Promise<ApiResponse<PagedResult<FriendRequestResponseDto>>> => {
        const response = await axiosInstance.get<
            ApiResponse<PagedResult<FriendRequestResponseDto>>
        >(`${FRIENDSHIPS_URL}/requests/pending`, {
            params: { pageNumber, pageSize },
        });
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(
                (item) => ({
                    ...item,
                    requesterAvatarUrl: resolveUrl(item.requesterAvatarUrl),
                })
            );
        }
        return response.data;
    },

    getSentRequests: async (
        pageNumber = 1,
        pageSize = 20
    ): Promise<ApiResponse<PagedResult<SentFriendRequestResponseDto>>> => {
        const response = await axiosInstance.get<
            ApiResponse<PagedResult<SentFriendRequestResponseDto>>
        >(`${FRIENDSHIPS_URL}/requests/sent`, {
            params: { pageNumber, pageSize },
        });
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(
                (item) => ({
                    ...item,
                    addresseeAvatarUrl: resolveUrl(item.addresseeAvatarUrl),
                })
            );
        }
        return response.data;
    },

    getFriends: async (
        userId: string,
        pageNumber = 1,
        pageSize = 20
    ): Promise<ApiResponse<PagedResult<FriendshipResponseDto>>> => {
        const response = await axiosInstance.get<
            ApiResponse<PagedResult<FriendshipResponseDto>>
        >(`${FRIENDSHIPS_URL}/user/${userId}`, {
            params: { pageNumber, pageSize },
        });
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(
                (item) => ({
                    ...item,
                    requesterAvatarUrl: resolveUrl(item.requesterAvatarUrl),
                    addresseeAvatarUrl: resolveUrl(item.addresseeAvatarUrl),
                })
            );
        }
        return response.data;
    },

    getSuggestions: async (): Promise<
        ApiResponse<FriendSuggestionDto[]>
    > => {
        const response = await axiosInstance.get<
            ApiResponse<FriendSuggestionDto[]>
        >(`${FRIENDSHIPS_URL}/suggestions`);
        if (response.data?.data) {
            response.data.data = response.data.data.map((item) => ({
                ...item,
                avatarUrl: resolveUrl(item.avatarUrl),
            }));
        }
        return response.data;
    },

    getFriendCount: async (
        userId: string
    ): Promise<ApiResponse<FriendCountResponseDto>> => {
        const response = await axiosInstance.get<
            ApiResponse<FriendCountResponseDto>
        >(`${FRIENDSHIPS_URL}/user/${userId}/count`);
        return response.data;
    },

    // =========================================================
    // 3. CLOSE FRIEND (BẠN THÂN)
    // =========================================================

    /**
     * Thêm người dùng vào danh sách bạn thân.
     * POST /friendships/close-friends
     * Body: { FriendId: string }
     */
    addCloseFriend: async (friendId: string): Promise<ApiResponse> => {
        const response = await axiosInstance.post<ApiResponse>(
            `${FRIENDSHIPS_URL}/close-friends`,
            { FriendId: friendId } // key viết hoa như Controller yêu cầu
        );
        return response.data;
    },

    /**
     * Xóa người dùng khỏi danh sách bạn thân.
     * DELETE /friendships/close-friends/{friendId}
     */
    removeCloseFriend: async (friendId: string): Promise<ApiResponse> => {
        const response = await axiosInstance.delete<ApiResponse>(
            `${FRIENDSHIPS_URL}/close-friends/${friendId}`
        );
        return response.data;
    },

    /**
     * Lấy danh sách bạn thân (có phân trang).
     * GET /friendships/close-friends?pageNumber=...&pageSize=...
     */
    getCloseFriends: async (
        pageNumber = 1,
        pageSize = 20
    ): Promise<ApiResponse<PagedResult<UserSummaryDto>>> => {
        const response = await axiosInstance.get<
            ApiResponse<PagedResult<UserSummaryDto>>
        >(`${FRIENDSHIPS_URL}/close-friends`, {
            params: { pageNumber, pageSize },
        });
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map(
                (item) => ({
                    ...item,
                    avatarUrl: resolveUrl(item.avatarUrl),
                })
            );
        }
        return response.data;
    },
};

export default friendshipApi;