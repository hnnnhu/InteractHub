// src/hooks/useCloseFriends.ts

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { friendshipApi } from '../api/friendshipApi';
import type { UserSummaryDto, PagedResult } from '../types/friendship';

interface UseCloseFriendsOptions {
    pageSize?: number;
}

export function useCloseFriends({ pageSize = 20 }: UseCloseFriendsOptions = {}) {
    const [pageNumber, setPageNumber] = useState(1);

    const queryKey = ['close-friends', pageNumber, pageSize] as const;

    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useQuery<PagedResult<UserSummaryDto>, Error>({
        queryKey,
        queryFn: async () => {
            // Kiểm tra token trước khi gọi
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.');
            }

            const res = await friendshipApi.getCloseFriends(pageNumber, pageSize);
            if (!res.isSuccess) {
                console.error('❌ getCloseFriends error:', res.message, res.errors);
                throw new Error(res.message || 'Không thể tải danh sách bạn thân.');
            }
            if (!res.data) {
                throw new Error('Dữ liệu bạn thân không có sẵn.');
            }
            return res.data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60, // 1 phút
        retry: (failureCount, error) => {
            // Không retry nếu lỗi 400 hoặc 401
            if (error.message.includes('400') || error.message.includes('401') || error.message.includes('Chưa đăng nhập')) {
                return false;
            }
            return failureCount < 2;
        },
    });

    const hasMore = data?.hasNextPage ?? false;
    const items: UserSummaryDto[] = data?.items ?? [];
    const totalCount = data?.totalCount ?? 0;

    const loadMore = useCallback(() => {
        if (!isFetching && hasMore) {
            setPageNumber((prev) => prev + 1);
        }
    }, [isFetching, hasMore]);

    const goToPage = useCallback((page: number) => {
        setPageNumber(page);
    }, []);

    return {
        closeFriends: items,
        totalCount,
        isLoading,
        isFetching,
        error: error?.message || null,
        hasMore,
        loadMore,
        goToPage,
        refresh: refetch,
        currentPage: pageNumber,
    };
}