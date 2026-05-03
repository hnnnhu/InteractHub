// src/hooks/useDeactivateAccount.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '../api/userApi';
import authApi from '../api/authApi';
// ✅ Sửa lỗi: Sử dụng 'import type' để tuân thủ verbatimModuleSyntax
import type { ApiResponse } from '../api/authApi';

/**
 * Hook quản lý việc vô hiệu hóa và khôi phục tài khoản người dùng.
 */
export default function useDeactivateAccount() {
    const queryClient = useQueryClient();

    // ==========================================
    // 1. DEACTIVATE ACCOUNT
    // ==========================================
    const deactivateMutation = useMutation({
        // ✅ Sửa lỗi: Khai báo kiểu trả về rõ ràng để sử dụng ApiResponse đã import
        mutationFn: async (): Promise<ApiResponse> => {
            const res = await userApi.deactivateAccount();
            if (!res.isSuccess) {
                throw new Error(res.message || 'Không thể vô hiệu hóa tài khoản lúc này.');
            }
            return res;
        },
        onSuccess: (res: ApiResponse) => {
            if (res.isSuccess) {
                authApi.logout();
            }
        }
    });

    // ==========================================
    // 2. RESTORE ACCOUNT
    // ==========================================
    const restoreMutation = useMutation({
        mutationFn: async (): Promise<ApiResponse> => {
            const res = await userApi.restoreAccount();
            if (!res.isSuccess) {
                throw new Error(res.message || 'Khôi phục tài khoản thất bại.');
            }
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile', 'me'] });
        }
    });

    return {
        deactivateAccount: deactivateMutation.mutateAsync,
        restoreAccount: restoreMutation.mutateAsync,
        isDeactivating: deactivateMutation.isPending,
        isRestoring: restoreMutation.isPending,
        deactivateError: deactivateMutation.error?.message || null,
        restoreError: restoreMutation.error?.message || null,
        isDeactivateSuccess: deactivateMutation.isSuccess,
        isRestoreSuccess: restoreMutation.isSuccess
    };
}