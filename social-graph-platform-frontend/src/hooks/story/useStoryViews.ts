// src/hooks/story/useStoryViews.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import storyApi from '../../api/storyApi';
import type { PagedResult, StoryViewDto } from '../../types/story';

export function useStoryViews(storyId: string, pageSize = 20) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [accumulatedViews, setAccumulatedViews] = useState<StoryViewDto[]>([]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        staleTime: 0, // luôn fetch mới để thấy người xem ngay
    });

    // Đồng bộ dữ liệu vào accumulatedViews một cách an toàn (tránh cascading renders)
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (pagedData?.items) {
            timeoutRef.current = setTimeout(() => {
                if (page === 1) {
                    setAccumulatedViews(pagedData.items);
                } else {
                    setAccumulatedViews(prev => {
                        const existingIds = new Set(prev.map(v => v.id));
                        const newItems = pagedData.items.filter(v => !existingIds.has(v.id));
                        return [...prev, ...newItems];
                    });
                }
            }, 0);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [pagedData, page]);

    const hasMore = pagedData ? page * pageSize < pagedData.totalCount : false;

    const loadMore = useCallback(() => {
        if (hasMore && !isFetching) {
            setPage(prev => prev + 1);
        }
    }, [hasMore, isFetching]);

    const refresh = useCallback(() => {
        setPage(1);
        queryClient.invalidateQueries({ queryKey: ['storyViews', storyId] });
    }, [queryClient, storyId]);

    return {
        views: accumulatedViews,
        loading: isLoading,
        error: error?.message ?? null,
        hasMore,
        loadMore,
        refresh,
    };
}