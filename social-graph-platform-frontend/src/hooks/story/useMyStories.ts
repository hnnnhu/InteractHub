// src/hooks/story/useMyStories.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storyApi } from '../../api/storyApi';
import type { ActiveStoryDto } from '../../types/story';

export function useMyStories() {
    const queryClient = useQueryClient();

    const {
        data: myStories = null,
        isLoading,
        error,
    } = useQuery<ActiveStoryDto | null, Error>({
        queryKey: ['stories', 'me'],
        queryFn: async () => {
            const response = await storyApi.getMyStories();
            if (!response.isSuccess) {
                throw new Error(response.message || 'Không thể tải story của bạn');
            }
            return response.data ?? null;
        },
        staleTime: 0,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['stories', 'me'] });
    };

    return {
        myStories,
        loading: isLoading,
        error: error?.message ?? null,
        refresh,
    };
}