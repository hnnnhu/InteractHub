// src/hooks/useFriendSuggestions.ts

import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { friendshipApi } from '../api/friendshipApi';
import type { FriendSuggestionDto } from '../types/friendship';

export default function useFriendSuggestions() {
    const [suggestions, setSuggestions] = useState<FriendSuggestionDto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await friendshipApi.getSuggestions();
            if (res.isSuccess && res.data) {
                setSuggestions(res.data);
            }
        } catch (err: unknown) {
            console.error("Lỗi khi tải danh sách gợi ý kết bạn:", err);
            setError(isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'Không thể lấy gợi ý.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        // Sử dụng setTimeout(..., 0) để đẩy việc gọi hàm ra khỏi chu kỳ render đồng bộ,
        // khắc phục triệt để cảnh báo cascading renders của ESLint.
        const timerId = setTimeout(() => {
            if (isMounted) fetchSuggestions();
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timerId);
        };
    }, [fetchSuggestions]);

    // Khi người dùng bấm "Kết bạn" ở một gợi ý, lập tức ẩn người đó đi
    const removeSuggestionFromState = useCallback((userId: string) => {
        setSuggestions(prev => prev.filter(s => s.userId !== userId));
    }, []);

    return { suggestions, isLoading, error, fetchSuggestions, removeSuggestionFromState };
}