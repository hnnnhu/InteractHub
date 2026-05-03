// src/hooks/story/useStoryViews.ts
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import storyApi from '../../api/storyApi';
import type { PagedResult, StoryViewDto } from '../../types/story';

export function useStoryViews(storyId: string, pageSize = 20) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    const {
        data: pagedData,
        isLoading,
        error,
        isFetching,
    } = useQuery<PagedResult<StoryViewDto>>({
        queryKey: ['storyViews', storyId, page],
        queryFn: async () => {
            const res = await storyApi.getStoryViews(storyId, page, pageSize);
            if (!res.isSuccess || !res.data) {
                throw new Error(res.message || 'Không thể tải danh sách người xem');
            }
            return res.data;
        },
        enabled: !!storyId,
        staleTime: 3 * 60 * 1000,
    });

    const views = useMemo(() => pagedData?.items ?? [], [pagedData]);

    const hasMore = useMemo(() => {
        if (!pagedData) return false;
        return page * pageSize < pagedData.totalCount;
    }, [pagedData, page, pageSize]);

    const loadMore = useCallback(() => {
        if (hasMore && !isFetching) {
            setPage((prev) => prev + 1);
        }
    }, [hasMore, isFetching]);

    const refresh = useCallback(() => {
        setPage(1);
        queryClient.invalidateQueries({ queryKey: ['storyViews', storyId] });
    }, [queryClient, storyId]);

    return {
        views,
        loading: isLoading,
        error: error?.message ?? null,
        hasMore,
        loadMore,
        refresh,
    };
}