// src/hooks/useTwoFactor.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '../api/userApi';
import type { TwoFactorSetupDto } from '../types/user';

// Query Keys để quản lý Cache
export const TWO_FACTOR_QUERY_KEY = {
    setup: ['2fa-setup'] as const,
    status: ['user-profile', 'me'] as const, // Tận dụng profile để biết 2FA đã bật chưa
};

export default function useTwoFactor() {
    const queryClient = useQueryClient();

    // ==========================================
    // 1. FETCH SETUP (Lấy mã QR & Secret Key)
    // ==========================================
    const {
        data: setupData,
        isLoading: isFetchingSetup,
        error: fetchError,
        refetch: fetchTwoFactorSetup
    } = useQuery<TwoFactorSetupDto, Error>({
        queryKey: TWO_FACTOR_QUERY_KEY.setup,
        queryFn: async () => {
            const res = await userApi.getTwoFactorSetup();
            if (!res.isSuccess || !res.data) {
                throw new Error(res.message || 'Không thể lấy thông tin thiết lập 2FA.');
            }
            return res.data;
        },
        enabled: false, // Chỉ fetch khi người dùng nhấn nút "Bắt đầu thiết lập"
        retry: false
    });

    // ==========================================
    // 2. ENABLE 2FA (Kích hoạt)
    // ==========================================
    const enableMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await userApi.enableTwoFactor(code);
            if (!res.isSuccess) throw new Error(res.message || 'Mã xác thực không đúng.');
            return res.data; // Trả về danh sách Recovery Codes
        },
        onSuccess: () => {
            // Cập nhật lại cache profile để UI biết 2FA đã được bật
            queryClient.invalidateQueries({ queryKey: TWO_FACTOR_QUERY_KEY.status });
            // Xóa setup data cũ
            queryClient.setQueryData(TWO_FACTOR_QUERY_KEY.setup, null);
        }
    });

    // ==========================================
    // 3. DISABLE 2FA (Hủy kích hoạt)
    // ==========================================
    const disableMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await userApi.disableTwoFactor(code);
            if (!res.isSuccess) throw new Error(res.message || 'Lỗi khi tắt 2FA.');
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TWO_FACTOR_QUERY_KEY.status });
        }
    });

    // ==========================================
    // 4. GENERATE RECOVERY CODES (Tạo mã mới)
    // ==========================================
    const generateCodesMutation = useMutation({
        mutationFn: async () => {
            const res = await userApi.generateRecoveryCodes();
            if (!res.isSuccess) throw new Error(res.message || 'Không thể tạo mã khôi phục mới.');
            return res.data;
        }
    });

    return {
        // State
        setupData,
        recoveryCodes: enableMutation.data || generateCodesMutation.data || null,
        isLoading: isFetchingSetup || enableMutation.isPending || disableMutation.isPending || generateCodesMutation.isPending,
        error: fetchError?.message || enableMutation.error?.message || disableMutation.error?.message || null,

        // Actions
        fetchTwoFactorSetup,
        enableTwoFactor: enableMutation.mutateAsync,
        disableTwoFactor: disableMutation.mutateAsync,
        generateRecoveryCodes: generateCodesMutation.mutateAsync,

        // Status Flags
        isSuccess: enableMutation.isSuccess || disableMutation.isSuccess,
        resetStatus: () => {
            enableMutation.reset();
            disableMutation.reset();
            generateCodesMutation.reset();
        }
    };
}