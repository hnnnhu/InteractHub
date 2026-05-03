// hooks/useMarkAsRead.ts

import { useState, useCallback } from 'react';
import { notificationApi } from '../api/notificationApi';

interface UseMarkAsReadReturn {
    /** Đang thực hiện đánh dấu */
    loading: boolean;
    /** Lỗi nếu có */
    error: string | null;
    /** Đánh dấu một hoặc nhiều thông báo là đã đọc */
    markAsRead: (notificationIds: string[]) => Promise<boolean>;
    /** Đánh dấu tất cả thông báo là đã đọc */
    markAllAsRead: () => Promise<boolean>;
    /** Xoá trạng thái lỗi */
    clearError: () => void;
}

/**
 * Hook thực hiện việc đánh dấu đã đọc cho một hoặc tất cả thông báo.
 * Các hàm trả về `Promise<boolean>` (true nếu thành công).
 */
export const useMarkAsRead = (): UseMarkAsReadReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const markAsRead = useCallback(async (notificationIds: string[]): Promise<boolean> => {
        if (notificationIds.length === 0) return true;

        setLoading(true);
        setError(null);
        try {
            const res = await notificationApi.markAsRead({
                notificationIds,
                markAll: false,
            });
            if (res.isSuccess) {
                return true;
            }
            setError(res.message ?? 'Đánh dấu thất bại');
            return false;
        } catch {
            setError('Lỗi kết nối');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const markAllAsRead = useCallback(async (): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const res = await notificationApi.markAsRead({ markAll: true });
            if (res.isSuccess) {
                return true;
            }
            setError(res.message ?? 'Đánh dấu tất cả thất bại');
            return false;
        } catch {
            setError('Lỗi kết nối');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return {
        loading,
        error,
        markAsRead,
        markAllAsRead,
        clearError,
    };
};