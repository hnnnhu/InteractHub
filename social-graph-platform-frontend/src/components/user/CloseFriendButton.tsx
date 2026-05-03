// src/components/user/CloseFriendButton.tsx
import React, { useCallback } from 'react';
import { Star, StarOff, Loader2, AlertTriangle } from 'lucide-react';
import { useCloseFriendsActions } from '../../hooks/useCloseFriendsActions';
import type { ApiResponse } from '../../types/friendship'; // hoặc từ '../../api/authApi'

interface CloseFriendButtonProps {
    targetUserId: string;
    isCloseFriend?: boolean;
    onSuccess?: () => void;
    className?: string;
}

const CloseFriendButton: React.FC<CloseFriendButtonProps> = ({
    targetUserId,
    isCloseFriend = false,
    onSuccess,
    className = '',
}) => {
    const {
        addCloseFriend,
        removeCloseFriend,
        isAdding,
        isRemoving,
        error: mutationError,
    } = useCloseFriendsActions();

    const isLoading = isAdding || isRemoving;

    const handleToggle = useCallback(
        async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isLoading) return;

            try {
                let response: ApiResponse | undefined;
                if (isCloseFriend) {
                    response = await removeCloseFriend(targetUserId);
                } else {
                    response = await addCloseFriend(targetUserId);
                }

                if (response?.isSuccess) {
                    onSuccess?.();
                } else {
                    // Backend trả về thất bại (ví dụ: chưa là bạn bè)
                    const reason = response?.message || 'Không thể thực hiện thao tác.';
                    console.warn('CloseFriend API failed:', reason);
                    alert(reason);
                }
            } catch (err: unknown) {
                console.error('CloseFriendButton toggle error:', err);
                if (err instanceof Error) {
                    alert(err.message);
                } else {
                    alert('Thao tác thất bại. Vui lòng thử lại sau.');
                }
            }
        },
        [isLoading, isCloseFriend, targetUserId, addCloseFriend, removeCloseFriend, onSuccess]
    );

    return (
        <div className="relative inline-block">
            <button
                onClick={handleToggle}
                disabled={isLoading}
                aria-label={isCloseFriend ? 'Bỏ bạn thân' : 'Thêm vào bạn thân'}
                title={isCloseFriend ? 'Bỏ bạn thân' : 'Thêm vào bạn thân'}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95
          ${isCloseFriend
                        ? 'bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-amber-400 border border-white/10'
                    }
          ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
          ${className}
        `}
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : isCloseFriend ? (
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                ) : (
                    <StarOff size={16} />
                )}
                <span className="hidden sm:inline">
                    {isCloseFriend ? 'Bạn thân' : 'Bạn thân'}
                </span>
            </button>

            {/* Hiển thị lỗi nếu có */}
            {mutationError && !isLoading && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 whitespace-nowrap rounded-lg bg-red-500 px-3 py-1.5 text-xs text-white shadow-lg">
                    <AlertTriangle size={12} />
                    <span>{mutationError}</span>
                </div>
            )}
        </div>
    );
};

export default CloseFriendButton;