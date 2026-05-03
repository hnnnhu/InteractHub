// hooks/useNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { notificationApi } from '../api/notificationApi';
import type { NotificationResponseDto } from '../types/notification';

interface UseNotificationsOptions {
    typeFilter?: number;
    unreadOnly?: boolean;
    pageSize?: number;
}

interface UseNotificationsReturn {
    notifications: NotificationResponseDto[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refresh: () => void;
}

// Token reader đồng bộ với axiosInstance (dùng key `accessToken`)
const getToken = (): string | null => localStorage.getItem('accessToken');

export const useNotifications = ({
    typeFilter,
    unreadOnly,
    pageSize = 10,
}: UseNotificationsOptions = {}): UseNotificationsReturn => {
    const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);

    const abortControllerRef = useRef<AbortController | null>(null);
    const isMounted = useRef(true);

    // FIX 1: Effect riêng để quản lý isMounted
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const hasToken = useCallback((): boolean => !!getToken(), []);

    const fetchData = useCallback(
        async (page: number, append: boolean, signal: AbortSignal): Promise<boolean> => {
            if (!hasToken()) {
                setLoading(false);
                return false;
            }

            setLoading(true);
            setError(null);
            try {
                const res = await notificationApi.getNotifications(
                    page, pageSize, typeFilter, unreadOnly
                );

                // FIX 2: Kiểm tra signal.aborted TRƯỚC khi setState
                if (!isMounted.current || signal.aborted) return false;

                if (res.isSuccess && res.data) {
                    const { items, totalCount } = res.data;
                    setNotifications(prev => (append ? [...prev, ...items] : items));
                    setHasMore(page * pageSize < totalCount);
                    if (!append) setPageNumber(page);
                    return true;
                } else {
                    setError(res.message || 'Không thể tải thông báo');
                    setHasMore(false);
                    return false;
                }
            } catch (err: unknown) {
                if (!isMounted.current || signal.aborted) return false;

                if (axios.isAxiosError(err) && err.response?.status !== 401) {
                    setError('Lỗi kết nối đến máy chủ');
                } else if (!axios.isAxiosError(err)) {
                    setError('Lỗi không xác định');
                }
                setHasMore(false);
                return false;
            } finally {
                // FIX 3: Chỉ setLoading(false) khi không bị abort
                if (isMounted.current && !signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [typeFilter, unreadOnly, pageSize, hasToken],
    );

    useEffect(() => {
        const load = () => {
            if (!hasToken()) {
                setNotifications([]);
                setHasMore(true);
                setLoading(false);
                setError(null);
                return;
            }
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            // FIX 4: Bỏ queueMicrotask, gọi trực tiếp
            void fetchData(1, false, signal);
        };

        load();

        window.addEventListener('storage', load);
        window.addEventListener('auth-change', load);

        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('auth-change', load);
            abortControllerRef.current?.abort();
            // KHÔNG set isMounted.current = false ở đây vì đã có effect riêng
        };
    }, [fetchData, hasToken]);

    const loadMore = useCallback(() => {
        if (loading || !hasMore || !hasToken()) return;
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const nextPage = pageNumber + 1;
        void fetchData(nextPage, true, signal);
    }, [loading, hasMore, pageNumber, fetchData, hasToken]);

    const refresh = useCallback(() => {
        if (!hasToken()) return;
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        void fetchData(1, false, signal);
    }, [fetchData, hasToken]);

    return { notifications, loading, error, hasMore, loadMore, refresh };
};