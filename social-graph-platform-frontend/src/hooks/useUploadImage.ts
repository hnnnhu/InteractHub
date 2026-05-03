// src/hooks/useUploadImage.ts

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '../api/userApi';
import type { ApiResponse } from '../api/authApi';
// Đảm bảo file useUserProfile.ts có export: const USER_QUERY_KEY = 'user-profile';
import { USER_QUERY_KEY } from './useUserProfile';

export default function useUploadImage() {
    const queryClient = useQueryClient();
    const [progress, setProgress] = useState<number>(0);

    // ==========================================
    // 1. MUTATION CHO AVATAR
    // ==========================================
    const avatarMutation = useMutation({
        mutationFn: async (file: File): Promise<ApiResponse> => {
            setProgress(0); // Reset tiến trình về 0%

            const res = await userApi.uploadAvatar(file, {
                // Sử dụng tính năng theo dõi tiến trình của Axios
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || 1;
                    const current = progressEvent.loaded;
                    const percentCompleted = Math.round((current * 100) / total);
                    setProgress(percentCompleted);
                },
            });

            if (!res.isSuccess) {
                throw new Error(res.message || 'Lỗi khi upload ảnh đại diện.');
            }
            return res;
        },
        onSuccess: () => {
            // Làm mới cache của Profile "me" để hiển thị ảnh mới ngay lập tức
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, 'me'] });
        },
    });

    // ==========================================
    // 2. MUTATION CHO COVER PHOTO
    // ==========================================
    const coverMutation = useMutation({
        mutationFn: async (file: File): Promise<ApiResponse> => {
            setProgress(0);

            const res = await userApi.uploadCoverPhoto(file, {
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || 1;
                    const current = progressEvent.loaded;
                    const percentCompleted = Math.round((current * 100) / total);
                    setProgress(percentCompleted);
                },
            });

            if (!res.isSuccess) {
                throw new Error(res.message || 'Lỗi khi upload ảnh bìa.');
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, 'me'] });
        },
    });

    return {
        // Actions (Dùng mutateAsync để có thể dùng try/catch ở UI nếu cần)
        uploadAvatar: avatarMutation.mutateAsync,
        uploadCoverPhoto: coverMutation.mutateAsync,

        // States
        progress,
        isUploading: avatarMutation.isPending || coverMutation.isPending,
        isSuccess: avatarMutation.isSuccess || coverMutation.isSuccess,

        // Error handling
        error: avatarMutation.error?.message || coverMutation.error?.message || null,

        // Tiện ích dọn dẹp trạng thái (VD: khi đóng Modal upload)
        reset: () => {
            setProgress(0);
            avatarMutation.reset();
            coverMutation.reset();
        }
    };
}