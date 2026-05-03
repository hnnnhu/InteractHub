// src/hooks/useBlockedUsers.ts
import { useState, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import blockApi from '../api/blockApi';
import type { GetBlockedUsersParams } from '../types/block';

export function useBlockedUsers(initialPageSize = 20) {
    const [params, setParams] = useState<GetBlockedUsersParams>({
        search: undefined,
        sortBy: 'createdat',
        sortDirection: 'desc',
        pageNumber: 1,
        pageSize: initialPageSize,
    });

    const queryKey = ['blocks', 'list', params] as const;

    const {
        data,
        isLoading,
        isError,
        error,
        isFetching,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await blockApi.getBlockedUsers(params);
            if (!res.isSuccess || !res.data) throw new Error(res.message || 'Không thể tải danh sách chặn');
            return res.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 0,
    });

    const hasMore = data?.hasNextPage ?? false;

    const loadMore = useCallback(() => {
        if (!isFetching && hasMore) {
            setParams(prev => ({ ...prev, pageNumber: (prev.pageNumber || 1) + 1 }));
        }
    }, [isFetching, hasMore]);

    const setSearch = useCallback((search: string) => {
        setParams(prev => ({
            ...prev,
            search: search || undefined,
            pageNumber: 1,
        }));
    }, []);

    const setSorting = useCallback((sortBy?: string, sortDirection?: string) => {
        setParams(prev => ({
            ...prev,
            sortBy: sortBy || 'createdat',
            sortDirection: sortDirection || 'desc',
            pageNumber: 1,
        }));
    }, []);

    const setPageSize = useCallback((pageSize: number) => {
        setParams(prev => ({
            ...prev,
            pageSize,
            pageNumber: 1,
        }));
    }, []);

    const refresh = useCallback(() => {
        refetch();
    }, [refetch]);

    return {
        blockedUsers: data?.items || [],
        totalCount: data?.totalCount ?? 0,
        isLoading,
        isFetching,
        isError,
        error: error?.message || null,
        hasMore,
        loadMore,
        setSearch,
        setSorting,
        setPageSize,
        refresh,
        currentPage: params.pageNumber || 1,
    };
}