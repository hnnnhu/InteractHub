// src/hooks/usePendingRequests.ts

import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { friendshipApi } from '../api/friendshipApi';
import type { FriendRequestResponseDto } from '../types/friendship';

export default function usePendingRequests(initialPageSize: number = 20) {
    const [requests, setRequests] = useState<FriendRequestResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [totalCount, setTotalCount] = useState<number>(0);

    const fetchFirstPage = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await friendshipApi.getPendingRequests(1, initialPageSize);
            if (res.isSuccess && res.data) {
                setRequests(res.data.items);
                setHasMore(res.data.hasNextPage);
                setTotalCount(res.data.totalCount);
                setCurrentPage(1);
            }
        } catch (err: unknown) {
            console.error("Lỗi khi tải danh sách chờ kết bạn:", err);
            setError(isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'Lỗi kết nối');
        } finally {
            setIsLoading(false);
        }
    }, [initialPageSize]);

    useEffect(() => {
        let isMounted = true;
        // Sử dụng setTimeout để đẩy fetchFirstPage ra khỏi chu kỳ render đồng bộ hiện tại,
        // tránh lỗi "cascading renders" từ ESLint.
        const timerId = setTimeout(() => {
            if (isMounted) fetchFirstPage();
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timerId);
        };
    }, [fetchFirstPage]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const res = await friendshipApi.getPendingRequests(nextPage, initialPageSize);
            if (res.isSuccess && res.data) {
                setRequests(prev => {
                    const existingIds = new Set(prev.map(r => r.friendshipId));
                    const newItems = res.data!.items.filter(r => !existingIds.has(r.friendshipId));
                    return [...prev, ...newItems];
                });
                setHasMore(res.data.hasNextPage);
                setCurrentPage(nextPage);
            }
        } catch (err: unknown) {
            console.error("Lỗi tải thêm danh sách chờ kết bạn:", err);
            setError('Không thể tải thêm.');
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, hasMore, isLoadingMore, initialPageSize]);

    // Hỗ trợ Optimistic UI: Khi chấp nhận/từ chối, gỡ item khỏi danh sách
    const removeRequestFromState = useCallback((friendshipId: string) => {
        setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
        setTotalCount(prev => Math.max(0, prev - 1));
    }, []);

    return { requests, isLoading, isLoadingMore, error, hasMore, totalCount, loadMore, fetchFirstPage, removeRequestFromState };
}