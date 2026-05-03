// src/hooks/useSessions.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '../api/userApi';
import type { SessionDto } from '../types/user';

// Khai báo Query Key hằng số để dễ dàng tái sử dụng và quản lý cache
export const SESSION_QUERY_KEY = ['active-sessions'];

export default function useSessions() {
    const queryClient = useQueryClient();

    // ==========================================
    // 1. FETCH SESSIONS (Lấy danh sách thiết bị)
    // ==========================================
    const {
        data: sessions = [],
        isLoading,
        error,
        refetch: fetchSessions
    } = useQuery<SessionDto[], Error>({
        queryKey: SESSION_QUERY_KEY,
        queryFn: async () => {
            const res = await userApi.getMySessions();
            if (!res.isSuccess) {
                throw new Error(res.message || 'Không thể tải danh sách phiên đăng nhập.');
            }
            return res.data || [];
        },
        // Tùy chọn: Không tự động fetch lại khi người dùng chuyển tab để tránh spam API
        refetchOnWindowFocus: false,
    });

    // ==========================================
    // 2. REVOKE SESSION (Đăng xuất 1 thiết bị)
    // ==========================================
    const revokeSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            const res = await userApi.revokeSession(sessionId);
            if (!res.isSuccess) throw new Error(res.message || 'Lỗi khi hủy phiên đăng nhập.');
            return res;
        },
        onSuccess: (_, deletedSessionId) => {
            // Optimistic Update: Xóa ngay session khỏi UI mà không cần đợi fetch lại
            queryClient.setQueryData<SessionDto[]>(SESSION_QUERY_KEY, (oldSessions) => {
                if (!oldSessions) return [];
                return oldSessions.filter(session => session.id !== deletedSessionId);
            });
        }
    });

    // ==========================================
    // 3. LOGOUT OTHER DEVICES (Đăng xuất thiết bị khác)
    // ==========================================
    const logoutOtherDevicesMutation = useMutation({
        // Giả sử api của bạn tên là logoutOtherDevices (hoặc đổi thành logoutAllOtherDevices tùy file API)
        mutationFn: async () => {
            const res = await userApi.logoutOtherDevices();
            if (!res.isSuccess) throw new Error(res.message || 'Lỗi khi đăng xuất các thiết bị khác.');
            return res;
        },
        onSuccess: () => {
            // Invalidate để tự động gọi lại API lấy danh sách mới nhất (chỉ còn lại thiết bị hiện tại)
            queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        }
    });

    // ==========================================
    // 4. LOGOUT ALL DEVICES (Đăng xuất tất cả)
    // ==========================================
    const logoutAllDevicesMutation = useMutation({
        mutationFn: async () => {
            const res = await userApi.logoutAllDevices();
            if (!res.isSuccess) throw new Error(res.message || 'Lỗi khi đăng xuất toàn bộ thiết bị.');
            return res;
        },
        onSuccess: () => {
            // 1. Xóa toàn bộ cache liên quan đến người dùng hiện tại
            queryClient.clear();

            // 2. Xóa Token ở dưới Client (LocalStorage)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // 3. Điều hướng mạnh về trang đăng nhập
            window.location.href = '/login';
        }
    });

    return {
        // State
        sessions,
        isLoading,
        error: error ? error.message : null,

        // Actions
        fetchSessions,

        revokeSession: revokeSessionMutation.mutateAsync,
        isRevoking: revokeSessionMutation.isPending,

        logoutAllOtherDevices: logoutOtherDevicesMutation.mutateAsync,
        isLoggingOutOthers: logoutOtherDevicesMutation.isPending,

        logoutAllDevices: logoutAllDevicesMutation.mutateAsync,
        isLoggingOutAll: logoutAllDevicesMutation.isPending,
    };
}