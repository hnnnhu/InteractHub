// src/hooks/useReaction.ts

import { useState } from 'react';
import { isAxiosError } from 'axios';
import reactionApi from '../api/reactionApi';
import type { ReactionType, ReactionCountDto } from '../types/reaction';

export const useReaction = (postId: string) => {
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Hành động thả cảm xúc hoặc đổi cảm xúc
     */
    const toggleReaction = async (
        type: ReactionType,
        onSuccess?: (newSummary: ReactionCountDto) => void,
        onError?: () => void
    ) => {
        setIsMutating(true);
        setError(null);
        try {
            const response = await reactionApi.addOrUpdateReaction({ postId, type });
            if (response.isSuccess && response.data) {
                // Thành công -> Báo cho UI cập nhật lại danh sách tổng
                if (onSuccess) onSuccess(response.data);
                return response.data;
            } else {
                throw new Error(response.message || 'Không thể thả cảm xúc');
            }
        } catch (err: unknown) {
            console.error('Lỗi khi thả cảm xúc:', err);
            let errorMessage = 'Lỗi kết nối máy chủ.';
            if (isAxiosError(err) && err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            setError(errorMessage);
            if (onError) onError();
        } finally {
            setIsMutating(false);
        }
    };

    /**
     * Hành động thu hồi (Xóa) cảm xúc hiện tại
     */
    const removeReaction = async (
        onSuccess?: () => void,
        onError?: () => void
    ) => {
        setIsMutating(true);
        setError(null);
        try {
            const response = await reactionApi.removeReaction(postId);
            if (response.isSuccess) {
                if (onSuccess) onSuccess();
            } else {
                throw new Error(response.message || 'Không thể gỡ cảm xúc');
            }
        } catch (err: unknown) {
            console.error('Lỗi khi gỡ cảm xúc:', err);
            let errorMessage = 'Lỗi kết nối máy chủ.';
            if (isAxiosError(err) && err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            setError(errorMessage);
            if (onError) onError();
        } finally {
            setIsMutating(false);
        }
    };

    return {
        toggleReaction,
        removeReaction,
        isMutating,
        error
    };
};

export default useReaction;