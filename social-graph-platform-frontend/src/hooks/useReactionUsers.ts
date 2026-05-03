// src/hooks/useReactionUsers.ts

import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import reactionApi from '../api/reactionApi';
import type { UserReactionDto } from '../types/reaction';

export const useReactionUsers = (postId: string, pageSize: number = 15) => {
    const [users, setUsers] = useState<UserReactionDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    /**
     * Lấy danh sách trang đầu tiên (Reset list)
     */
    const fetchFirstPage = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await reactionApi.getUsersReacted(postId, 1, pageSize);
            if (response.isSuccess && response.data) {
                setUsers(response.data.items);
                setHasMore(response.data.hasNextPage);
                setTotalCount(response.data.totalCount);
                setCurrentPage(1);
            }
        } catch (err: unknown) {
            console.error('Lỗi tải danh sách người dùng:', err);
            setError(isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'Không thể tải danh sách');
        } finally {
            setIsLoading(false);
        }
    }, [postId, pageSize]);

    /**
     * Tải thêm trang tiếp theo (Load More / Infinite Scroll)
     */
    const loadMoreUsers = useCallback(async () => {
        if (!hasMore || isLoadingMore) return;

        setIsLoadingMore(true);
        setError(null);
        const nextPage = currentPage + 1;

        try {
            const response = await reactionApi.getUsersReacted(postId, nextPage, pageSize);
            if (response.isSuccess && response.data) {
                setUsers(prev => {
                    // Lọc trùng lặp bằng ID
                    const existingIds = new Set(prev.map(u => u.userId));
                    const newUsers = response.data!.items.filter(u => !existingIds.has(u.userId));
                    return [...prev, ...newUsers];
                });
                setHasMore(response.data.hasNextPage);
                setCurrentPage(nextPage);
            }
        } catch (err: unknown) {
            console.error('Lỗi tải thêm danh sách người dùng:', err);
            setError('Không thể tải thêm dữ liệu');
        } finally {
            setIsLoadingMore(false);
        }
    }, [postId, currentPage, hasMore, isLoadingMore, pageSize]);

    return {
        users,
        totalCount,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        fetchFirstPage,
        loadMoreUsers
    };
};

export default useReactionUsers;