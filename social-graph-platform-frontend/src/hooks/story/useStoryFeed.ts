// src/hooks/story/useStoryFeed.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storyApi } from '../../api/storyApi';
import type { ActiveStoryDto } from '../../types/story';

export function useStoryFeed() {
    const queryClient = useQueryClient();

    const {
        data: feed = [],
        isLoading,
        error,
    } = useQuery<ActiveStoryDto[], Error>({
        queryKey: ['stories', 'feed'],
        queryFn: async () => {
            const response = await storyApi.getActiveStoriesFeed();
            if (!response.isSuccess || !response.data) {
                throw new Error(response.message || 'Không thể tải story feed');
            }
            return response.data;
        },
        staleTime: 30_000,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['stories', 'feed'] });
    };

    return {
        feed,
        loading: isLoading,
        error: error?.message ?? null,
        refresh,
    };
}