// src/hooks/useFriends.ts

import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { friendshipApi } from '../api/friendshipApi';
import type { FriendshipResponseDto } from '../types/friendship';

export default function useFriends(userId?: string, initialPageSize: number = 20) {
    const [friends, setFriends] = useState<FriendshipResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [totalCount, setTotalCount] = useState<number>(0);

    const [prevUserId, setPrevUserId] = useState(userId);

    // Kỹ thuật React 18: Reset state ngay lập tức khi đổi profile
    if (userId !== prevUserId) {
        setPrevUserId(userId);
        setIsLoading(!!userId);
        setError(null);
        setFriends([]);
        setCurrentPage(1);
        setHasMore(false);
        setTotalCount(0);
    }

    const fetchFirstPage = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);

        try {
            const res = await friendshipApi.getFriends(userId, 1, initialPageSize);
            if (res.isSuccess && res.data) {
                setFriends(res.data.items);
                setHasMore(res.data.hasNextPage);
                setTotalCount(res.data.totalCount);
                setCurrentPage(1);
            } else {
                setError(res.message || 'Không thể tải danh sách bạn bè.');
            }
        } catch (err: unknown) {
            console.error("Lỗi fetch bạn bè:", err);
            setError(isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'Lỗi kết nối máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, [userId, initialPageSize]);

    // Tự động fetch lần đầu
    useEffect(() => {
        let isMounted = true;
        const timerId = setTimeout(() => {
            if (isMounted && userId) fetchFirstPage();
        }, 0);
        return () => {
            isMounted = false;
            clearTimeout(timerId);
        };
    }, [fetchFirstPage, userId]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || !userId) return;

        setIsLoadingMore(true);
        setError(null);
        const nextPage = currentPage + 1;

        try {
            const res = await friendshipApi.getFriends(userId, nextPage, initialPageSize);
            if (res.isSuccess && res.data) {
                setFriends(prev => {
                    const existingIds = new Set(prev.map(f => f.id));
                    const newItems = res.data!.items.filter(f => !existingIds.has(f.id));
                    return [...prev, ...newItems];
                });
                setHasMore(res.data.hasNextPage);
                setCurrentPage(nextPage);
            }
        } catch (err: unknown) {
            // FIX: Đã sử dụng biến 'err' để in lỗi ra console
            console.error("Lỗi khi tải thêm bạn bè:", err);
            setError('Không thể tải thêm dữ liệu.');
        } finally {
            setIsLoadingMore(false);
        }
    }, [userId, currentPage, hasMore, isLoadingMore, initialPageSize]);

    // Xóa bạn bè khỏi danh sách ngay lập tức (Optimistic UI)
    const removeFriendFromState = useCallback((friendId: string) => {
        setFriends(prev => prev.filter(f => f.requesterId !== friendId && f.addresseeId !== friendId));
        setTotalCount(prev => Math.max(0, prev - 1));
    }, []);

    return { friends, isLoading, isLoadingMore, error, hasMore, totalCount, loadMore, fetchFirstPage, removeFriendFromState, setFriends };
}