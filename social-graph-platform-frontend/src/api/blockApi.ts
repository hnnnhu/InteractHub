// src/api/blockApi.ts

import axiosInstance from './axiosInstance';
import type {
    ApiResponse,
    PagedResult,
    BlockUserRequest,
    BlockedUserInfo,
    BlockStatus,
    GetBlockedUsersParams
} from '../types/block';

const BLOCKS_URL = '/blocks';

/**
 * Helper: Chuyển đổi đường dẫn tương đối thành URL tuyệt đối
 * (dùng để hiển thị ảnh đại diện từ backend)
 */
const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;

    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const blockApi = {
    /**
     * Chặn một người dùng
     * POST /api/blocks
     */
    blockUser: async (blockedId: string): Promise<ApiResponse> => {
        const payload: BlockUserRequest = { blockedId };
        const response = await axiosInstance.post<ApiResponse>(BLOCKS_URL, payload);
        return response.data;
    },

    /**
     * Gỡ chặn một người dùng
     * DELETE /api/blocks/{blockedId}
     */
    unblockUser: async (blockedId: string): Promise<ApiResponse> => {
        const response = await axiosInstance.delete<ApiResponse>(`${BLOCKS_URL}/${blockedId}`);
        return response.data;
    },

    /**
     * Lấy danh sách người dùng đang bị chặn (có tìm kiếm, sắp xếp, phân trang)
     * GET /api/blocks
     */
    getBlockedUsers: async (params: GetBlockedUsersParams = {}): Promise<ApiResponse<PagedResult<BlockedUserInfo>>> => {
        const response = await axiosInstance.get<ApiResponse<PagedResult<BlockedUserInfo>>>(BLOCKS_URL, {
            params: {
                search: params.search || undefined,
                sortBy: params.sortBy || undefined,
                sortDirection: params.sortDirection || undefined,
                pageNumber: params.pageNumber ?? 1,
                pageSize: params.pageSize ?? 20,
            },
        });

        // Chuẩn hóa AvatarUrl thành đường dẫn tuyệt đối để hiển thị đúng
        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map((user) => ({
                ...user,
                avatarUrl: resolveUrl(user.avatarUrl),
            }));
        }
        return response.data;
    },

    /**
     * Kiểm tra trạng thái chặn hai chiều với một người dùng khác
     * GET /api/blocks/{targetUserId}/status
     */
    getBlockStatus: async (targetUserId: string): Promise<ApiResponse<BlockStatus>> => {
        const response = await axiosInstance.get<ApiResponse<BlockStatus>>(
            `${BLOCKS_URL}/${targetUserId}/status`
        );
        return response.data;
    },
};

export default blockApi;