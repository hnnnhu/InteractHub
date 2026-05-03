// src/hooks/useBlockActions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import blockApi from '../api/blockApi';

export function useBlockActions() {
    const queryClient = useQueryClient();

    const blockUserMutation = useMutation({
        mutationFn: async (blockedId: string) => {
            const res = await blockApi.blockUser(blockedId);
            if (!res.isSuccess) throw new Error(res.message || 'Chặn thất bại');
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
        },
    });

    const unblockUserMutation = useMutation({
        mutationFn: async (blockedId: string) => {
            const res = await blockApi.unblockUser(blockedId);
            if (!res.isSuccess) throw new Error(res.message || 'Gỡ chặn thất bại');
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
        },
    });

    return {
        blockUser: blockUserMutation.mutateAsync,
        unblockUser: unblockUserMutation.mutateAsync,
        isBlocking: blockUserMutation.isPending,
        isUnblocking: unblockUserMutation.isPending,
        error: blockUserMutation.error?.message || unblockUserMutation.error?.message || null,
    };
}