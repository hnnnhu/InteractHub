// src/hooks/useFriendCount.ts

import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { friendshipApi } from '../api/friendshipApi';

export default function useFriendCount(userId?: string) {
    const [count, setCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(!!userId);
    const [error, setError] = useState<string | null>(null);

    const [prevUserId, setPrevUserId] = useState(userId);

    if (userId !== prevUserId) {
        setPrevUserId(userId);
        setIsLoading(!!userId);
        setError(null);
        setCount(0);
    }

    const fetchCount = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const res = await friendshipApi.getFriendCount(userId);
            if (res.isSuccess && res.data) {
                setCount(res.data.count);
            }
        } catch (err: unknown) {
            setError(isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'Lỗi lấy số lượng.');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
            if (isMounted && userId) fetchCount();
        }, 0);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [fetchCount, userId]);

    return { count, isLoading, error, fetchCount, setCount };
}