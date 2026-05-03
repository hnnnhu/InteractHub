// src/hooks/useBlockStatus.ts
import { useQuery } from '@tanstack/react-query';
import blockApi from '../api/blockApi';
import type { BlockStatus } from '../types/block';

export function useBlockStatus(targetUserId?: string | null) {
    const queryKey = ['blocks', 'status', targetUserId] as const;

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<BlockStatus>({
        queryKey,
        queryFn: async () => {
            if (!targetUserId) throw new Error('Thiếu ID người dùng');
            const res = await blockApi.getBlockStatus(targetUserId);
            if (!res.isSuccess || !res.data) throw new Error(res.message || 'Không thể kiểm tra trạng thái chặn');
            return res.data;
        },
        enabled: !!targetUserId,
        staleTime: 1000 * 60 * 5, // 5 phút
    });

    return {
        status: data,
        isLoading,
        isError,
        error: error?.message || null,
        refetch,
        isBlockedByMe: data?.isBlockedByMe ?? false,
        hasBlockedMe: data?.hasBlockedMe ?? false,
        isAnyBlocked: data?.isAnyBlocked ?? false,
    };
}