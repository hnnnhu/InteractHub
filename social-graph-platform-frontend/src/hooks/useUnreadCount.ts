// hooks/useUnreadCount.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../api/notificationApi';

interface UseUnreadCountOptions {
    pollingInterval?: number;
}

interface UseUnreadCountReturn {
    unreadCount: number | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

const getToken = (): string | null => localStorage.getItem('accessToken');

export const useUnreadCount = ({
    pollingInterval = 30000,
}: UseUnreadCountOptions = {}): UseUnreadCountReturn => {
    const [unreadCount, setUnreadCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchCount = useCallback(async () => {
        if (!getToken()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await notificationApi.getUnreadCount();
            if (!isMounted.current) return;
            if (res.isSuccess && res.data !== undefined) {
                setUnreadCount(res.data);
            } else {
                setError(res.message ?? 'Không thể lấy số lượng');
            }
        } catch {
            // 401 handled silently
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const load = () => {
            if (getToken()) fetchCount();
        };
        load();
        window.addEventListener('storage', load);
        window.addEventListener('auth-change', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('auth-change', load);
        };
    }, [fetchCount]);

    useEffect(() => {
        if (pollingInterval > 0 && getToken()) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                if (getToken()) fetchCount();
            }, pollingInterval);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [pollingInterval, fetchCount]);

    const refresh = useCallback(() => {
        if (getToken()) fetchCount();
    }, [fetchCount]);

    return { unreadCount, loading, error, refresh };
};