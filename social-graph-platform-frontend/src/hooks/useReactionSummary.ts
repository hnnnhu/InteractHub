// src/hooks/useReactionSummary.ts

import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import reactionApi from '../api/reactionApi';
import type { ReactionCountDto } from '../types/reaction';

export const useReactionSummary = (postId: string, initialData?: ReactionCountDto) => {
    // Nếu có dữ liệu mồi (từ PostCard truyền vào), dùng luôn để tránh flash màn hình
    const [summary, setSummary] = useState<ReactionCountDto | null>(initialData || null);

    // Khởi tạo mặc định isLoading là true nếu không có initialData
    const [isLoading, setIsLoading] = useState<boolean>(!initialData);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async (isSilentFetch = false) => {
        // [QUAN TRỌNG]: Ép toàn bộ logic bên dưới thành Bất đồng bộ (Async) thực sự.
        // Ngăn chặn hoàn toàn lỗi Cascading Renders khi component cha vô tình gọi hàm này.
        await Promise.resolve();

        if (!isSilentFetch) {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await reactionApi.getReactionSummary(postId);
            if (response.isSuccess && response.data) {
                setSummary(response.data);
            } else {
                setError(response.message || 'Không thể tải thống kê cảm xúc.');
            }
        } catch (err: unknown) {
            console.error(`Lỗi tải Reaction Summary cho Post ${postId}:`, err);
            let errorMessage = 'Lỗi kết nối máy chủ.';
            if (isAxiosError(err) && err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    // Tự động fetch nếu chưa có initialData
    useEffect(() => {
        let isMounted = true;

        if (!initialData) {
            // [QUAN TRỌNG]: Dùng setTimeout(..., 0) để đẩy tác vụ này ra khỏi chu kỳ Render đồng bộ của React.
            // Điều này tuân thủ 100% luật của ESLint và giúp UI không bị giật lag.
            const timerId = setTimeout(() => {
                if (isMounted) {
                    fetchSummary(true);
                }
            }, 0);

            return () => clearTimeout(timerId);
        }

        return () => {
            isMounted = false;
        };
    }, [fetchSummary, initialData]);

    return {
        summary,
        isLoading,
        error,
        fetchSummary,
        setSummary // Expose hàm này ra để component cha tự cập nhật Optimistic UI
    };
};

export default useReactionSummary;