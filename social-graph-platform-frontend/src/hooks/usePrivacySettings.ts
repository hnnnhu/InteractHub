// src/hooks/usePrivacySettings.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '../api/userApi';
import { PrivacyLevel } from '../types/privacy'; // hoặc từ '../types/user' tùy cấu trúc bạn lưu

// Định nghĩa Query Key để quản lý Cache
export const PRIVACY_QUERY_KEY = ['user-privacy'];

export default function usePrivacySettings() {
    const queryClient = useQueryClient();

    // ==========================================
    // 1. FETCH PRIVACY (Lấy quyền riêng tư hiện tại)
    // ==========================================
    const {
        data: profileVisibility = PrivacyLevel.Public, // Mặc định là Public nếu chưa có data
        isLoading: isFetching,
        error: fetchError,
        refetch: fetchPrivacy
    } = useQuery<PrivacyLevel, Error>({
        queryKey: PRIVACY_QUERY_KEY,
        queryFn: async () => {
            // Tận dụng endpoint lấy Profile hiện tại
            const res = await userApi.getCurrentUserProfile();

            if (!res.isSuccess) {
                throw new Error(res.message || 'Không thể tải cấu hình quyền riêng tư.');
            }

            // Giả định backend trả về thuộc tính profileVisibility trong UserProfileDto
            // Nếu null hoặc undefined, fallback về Public
            return res.data?.profileVisibility ?? PrivacyLevel.Public;
        },
        refetchOnWindowFocus: false, // Tránh fetch lại liên tục khi người dùng chuyển tab
    });

    // ==========================================
    // 2. UPDATE PRIVACY (Cập nhật quyền riêng tư)
    // ==========================================
    const updatePrivacyMutation = useMutation({
        mutationFn: async (newLevel: PrivacyLevel) => {
            const res = await userApi.updatePrivacy({ profileVisibility: newLevel });

            if (!res.isSuccess) {
                throw new Error(res.message || 'Cập nhật quyền riêng tư thất bại.');
            }
            return res;
        },
        onSuccess: (_, newLevel) => {
            // Optimistic Update: Cập nhật ngay lập tức UI mà không cần chờ gọi lại hàm GET
            queryClient.setQueryData<PrivacyLevel>(PRIVACY_QUERY_KEY, newLevel);

            // Invalidate cả query của User Profile gốc để mọi nơi dùng Profile đều được làm mới
            queryClient.invalidateQueries({ queryKey: ['user-profile', 'me'] });
        }
    });

    return {
        // State đã được gom chung và làm gọn
        profileVisibility,
        isLoading: isFetching || updatePrivacyMutation.isPending,
        error: fetchError?.message || updatePrivacyMutation.error?.message || null,
        success: updatePrivacyMutation.isSuccess,

        // Actions
        fetchPrivacy,
        updatePrivacy: updatePrivacyMutation.mutateAsync,

        // Reset trạng thái thành công/lỗi (hữu ích khi dùng với Toast notification)
        resetStatus: updatePrivacyMutation.reset
    };
}