// src/hooks/useCloseFriendsActions.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { friendshipApi } from '../api/friendshipApi';

export function useCloseFriendsActions() {
    const queryClient = useQueryClient();

    const addCloseFriendMutation = useMutation({
        mutationFn: (friendId: string) => friendshipApi.addCloseFriend(friendId),
        onSuccess: () => {
            // Làm mới danh sách bạn thân và cả danh sách bạn bè (vì có thay đổi isCloseFriend)
            queryClient.invalidateQueries({ queryKey: ['close-friends'] });
            queryClient.invalidateQueries({ queryKey: ['friends'] });
        },
    });

    const removeCloseFriendMutation = useMutation({
        mutationFn: (friendId: string) => friendshipApi.removeCloseFriend(friendId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['close-friends'] });
            queryClient.invalidateQueries({ queryKey: ['friends'] });
        },
    });

    return {
        addCloseFriend: addCloseFriendMutation.mutateAsync,
        removeCloseFriend: removeCloseFriendMutation.mutateAsync,
        isAdding: addCloseFriendMutation.isPending,
        isRemoving: removeCloseFriendMutation.isPending,
        error: addCloseFriendMutation.error?.message || removeCloseFriendMutation.error?.message || null,
    };
}